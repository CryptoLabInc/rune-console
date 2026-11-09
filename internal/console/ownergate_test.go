package console

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/CryptoLabInc/rune-console/internal/invites"
	"github.com/CryptoLabInc/rune-console/internal/server"
)

// recordingInviter counts self-invite issues and fails each one, so a request
// that gets past the gate stops before the cloud mail relay.
type recordingInviter struct{ issued atomic.Int32 }

func (f *recordingInviter) IssueSelfInvite(string, string) (invites.ClearBundle, server.InviteConnInfo, error) {
	f.issued.Add(1)
	return invites.ClearBundle{}, server.InviteConnInfo{}, errors.New("issuer not wired in this test")
}

type ownerGateFixture struct {
	h       http.Handler
	db      *sql.DB
	domain  atomic.Int32
	conn    *fakeConnector
	inviter *recordingInviter
	owner   string
	other   string
}

// newOwnerGateFixture mounts every /api/v1 surface and logs in twice through
// the real callback: alice claims the console, bob is a later non-owner login.
// tokA2 is alice's account as the cloud may spell it on a later login.
func newOwnerGateFixture(t *testing.T) *ownerGateFixture {
	t.Helper()
	ts := mockLoginCloud(t, map[string]string{"tokA": "alice@x.io", "tokA2": "Alice@X.IO", "tokB": "bob@x.io"})
	f := &ownerGateFixture{db: openTestDB(t), conn: &fakeConnector{}, inviter: &recordingInviter{}}
	h, dp, err := NewHandler(Deps{
		Port:       8787,
		APIBaseURL: ts.URL,
		WebBaseURL: ts.URL,
		DB:         f.db,
		DomainHandler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			f.domain.Add(1)
			w.WriteHeader(http.StatusNoContent)
		}),
		Connector: f.conn,
		Inviter:   f.inviter,
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(dp.Stop)
	f.h = h
	if f.owner = sessionCookieValue(doLogin(t, h, "tokA")); f.owner == "" {
		t.Fatal("owner login set no session cookie")
	}
	if f.other = sessionCookieValue(doLogin(t, h, "tokB")); f.other == "" {
		t.Fatal("non-owner login set no session cookie")
	}
	return f
}

func (f *ownerGateFixture) do(method, path, cookie string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, nil) // same-origin
	if cookie != "" {
		req.AddCookie(&http.Cookie{Name: cookieName, Value: cookie})
	}
	rr := httptest.NewRecorder()
	f.h.ServeHTTP(rr, req)
	return rr
}

var ownerOnlyRoutes = []struct{ method, path string }{
	{http.MethodGet, "/api/v1/teams/tree"},
	{http.MethodPost, "/api/v1/teams"},
	{http.MethodDelete, "/api/v1/teams/t1?memoryAction=purge"},
	{http.MethodPut, "/api/v1/teams/t1/members/roles"},
	{http.MethodGet, "/api/v1/users"},
	{http.MethodDelete, "/api/v1/users"},
	{http.MethodPost, "/api/v1/users/u1/members/roles"},
	{http.MethodPost, "/api/v1/invitations"},
	{http.MethodGet, "/api/v1/not-a-route"},
	{http.MethodPost, "/api/v1/workspace"},
	{http.MethodGet, "/api/v1/workspace"},
	{http.MethodDelete, "/api/v1/workspace"},
	{http.MethodPost, "/api/v1/workspace/stop"},
	{http.MethodPost, "/api/v1/workspace/start"},
	{http.MethodPost, "/api/v1/invite"},
}

func TestAPIRoutesRejectNonOwnerSession(t *testing.T) {
	f := newOwnerGateFixture(t)
	for _, rt := range ownerOnlyRoutes {
		rr := f.do(rt.method, rt.path, f.other)
		if rr.Code != http.StatusForbidden {
			t.Errorf("%s %s as non-owner: status = %d, want 403", rt.method, rt.path, rr.Code)
			continue
		}
		body := decodeErrorBody(t, rr)
		if body["code"] != "OWNER_REQUIRED" || body["message"] != "console owner access is required" {
			t.Errorf("%s %s as non-owner: body = %v, want OWNER_REQUIRED, console owner access is required", rt.method, rt.path, body)
		}
	}
	if n := f.domain.Load(); n != 0 {
		t.Errorf("domain handler reached %d times by a non-owner", n)
	}
	if c, d := f.conn.calls.Load(), f.conn.disconnects.Load(); c != 0 || d != 0 {
		t.Errorf("engine connects=%d disconnects=%d after non-owner workspace calls, want 0/0", c, d)
	}
	if n := f.inviter.issued.Load(); n != 0 {
		t.Errorf("self-invite issued %d times for a non-owner", n)
	}
}

func TestAPIRoutesKeepOriginAndSessionChecks(t *testing.T) {
	f := newOwnerGateFixture(t)
	for _, rt := range ownerOnlyRoutes {
		for _, site := range []string{"cross-site", "same-site"} {
			req := httptest.NewRequest(rt.method, rt.path, nil)
			req.Header.Set("Sec-Fetch-Site", site)
			req.AddCookie(&http.Cookie{Name: cookieName, Value: f.owner})
			rr := httptest.NewRecorder()
			f.h.ServeHTTP(rr, req)
			if rr.Code != http.StatusForbidden || decodeErrorBody(t, rr)["code"] != "ORIGIN_FORBIDDEN" {
				t.Errorf("%s %s as owner from %s: status = %d, want 403 ORIGIN_FORBIDDEN", rt.method, rt.path, site, rr.Code)
			}
		}
		if rr := f.do(rt.method, rt.path, ""); rr.Code != http.StatusUnauthorized || decodeErrorBody(t, rr)["code"] != "SESSION_INVALID" {
			t.Errorf("%s %s without a session: status = %d, want 401 SESSION_INVALID", rt.method, rt.path, rr.Code)
		}
	}
	if n := f.domain.Load(); n != 0 {
		t.Errorf("domain handler reached %d times without a same-origin session", n)
	}
	if c, d := f.conn.calls.Load(), f.conn.disconnects.Load(); c != 0 || d != 0 {
		t.Errorf("engine connects=%d disconnects=%d, want 0/0", c, d)
	}
	if n := f.inviter.issued.Load(); n != 0 {
		t.Errorf("self-invite issued %d times, want 0", n)
	}
}

func TestAPIRoutesAdmitOwnerSession(t *testing.T) {
	f := newOwnerGateFixture(t)
	for _, path := range []string{"/api/v1/teams/tree", "/api/v1/users", "/api/v1/not-a-route"} {
		if rr := f.do(http.MethodGet, path, f.owner); rr.Code != http.StatusNoContent {
			t.Errorf("GET %s as owner: status = %d, want 204 from the domain handler", path, rr.Code)
		}
	}
	drift := sessionCookieValue(doLogin(t, f.h, "tokA2"))
	if drift == "" {
		t.Fatal("owner login spelled Alice@X.IO set no session cookie")
	}
	if rr := f.do(http.MethodGet, "/api/v1/teams/tree", drift); rr.Code != http.StatusNoContent {
		t.Errorf("GET /api/v1/teams/tree as the owner spelled Alice@X.IO: status = %d, want 204", rr.Code)
	}
	if n := f.domain.Load(); n != 4 {
		t.Errorf("domain handler reached %d times by the owner, want 4", n)
	}
	if rr := f.do(http.MethodPost, "/api/v1/invite", f.owner); rr.Code == http.StatusForbidden {
		t.Errorf("POST /api/v1/invite as owner: status 403, want the request to reach the issuer")
	}
	if n := f.inviter.issued.Load(); n != 1 {
		t.Errorf("self-invite issued %d times for the owner, want 1", n)
	}
}

func TestNonOwnerKeepsSessionStatusAndLogout(t *testing.T) {
	f := newOwnerGateFixture(t)
	s := getSession(t, f.h, f.other)
	if s["logged_in"] != true || s["is_owner"] != false || s["owner_email"] != "alice@x.io" {
		t.Errorf("non-owner /console/session = %v, want logged_in, is_owner:false, owner_email alice@x.io", s)
	}
	if rr := f.do(http.MethodPost, "/console/auth/logout", f.other); rr.Code != http.StatusNoContent {
		t.Errorf("non-owner logout status = %d, want 204", rr.Code)
	}
}

func TestAPIRoutesFailClosedWhenOwnerUnreadable(t *testing.T) {
	f := newOwnerGateFixture(t)
	if _, err := f.db.Exec(`DROP TABLE console_owner`); err != nil {
		t.Fatal(err)
	}
	rr := f.do(http.MethodGet, "/api/v1/teams/tree", f.owner)
	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503 while the console owner cannot be read", rr.Code)
	}
	if body := decodeErrorBody(t, rr); body["code"] != "OWNER_UNAVAILABLE" {
		t.Errorf("code = %q, want OWNER_UNAVAILABLE", body["code"])
	}
	if n := f.domain.Load(); n != 0 {
		t.Errorf("domain handler reached %d times while the owner was unreadable", n)
	}
	if s := getSession(t, f.h, f.owner); s["is_owner"] != true {
		t.Errorf("/console/session is_owner = %v, want true (the session status fails open)", s["is_owner"])
	}
}

func TestAPIRoutesRejectSessionWhenUnclaimed(t *testing.T) {
	database := openTestDB(t)
	h, _, err := NewHandler(Deps{
		Port:       8787,
		APIBaseURL: "http://cloud.invalid",
		WebBaseURL: "http://web.invalid",
		DB:         database,
		DomainHandler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
	})
	if err != nil {
		t.Fatal(err)
	}
	sessions, err := newSessionStore(database, nil)
	if err != nil {
		t.Fatal(err)
	}
	sess, err := sessions.create("token", "cloud", json.RawMessage(`{"email":"a@x.io"}`))
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/tree", nil)
	req.AddCookie(&http.Cookie{Name: cookieName, Value: sess.ID})
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403 while no owner is bound", rr.Code)
	}
}

func TestAPIFallbackRequiresOwner(t *testing.T) {
	cases := []struct {
		session string
		want    int
	}{
		{session: "other@example.com", want: http.StatusForbidden},
		{session: "owner@example.com", want: http.StatusNotImplemented},
	}
	for _, tc := range cases {
		handler, cookie := updateTestHandler(t, tc.session, "owner@example.com", nil)
		req := httptest.NewRequest(http.MethodGet, "/api/v1/teams/tree", nil)
		req.AddCookie(cookie)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		if rr.Code != tc.want {
			t.Errorf("session %s: status = %d, want %d", tc.session, rr.Code, tc.want)
		}
	}
}
