# Console UI — Korean → English Inventory

Working document for the `UI-english-versions` branch. Swept from `frontend/src`
(55 files, test files excluded). Edit the **Proposed English** column as needed,
then we apply the changes file by file.

Conventions used in proposals:
- Buttons / headings / modal titles: Title Case. Messages / hints: sentence case.
- `{var}` marks an interpolated value; "(restructure)" flags strings whose Korean
  particle logic (이/가, 은/는) or word order must be rearranged in English.
- Korean-only code comments are listed at the end (translate optionally).

**Highest-leverage first:** ~60 strings live in two constants files and cover
most buttons, modal titles, nav items, and status badges across the app.

---

## 1. Shared constants (`constants/commonConstants.ts`)

### BTN_TEXT

| Location | Korean | Proposed English | Approved |
|---|---|---|---|
| `:16 (close)` | 닫기 | Close | ✅ |
| `:17 (cancel)` | 취소 | Cancel | ✅ |
| `:18 (confirm)` | 확인 | Confirm | ✅ |
| `:19 (save)` | 저장 | Save | ✅ |
| `:20 (delete)` | 삭제하기 | Delete | ✅ |
| `:21 (remove)` | 제거하기 | Remove | ✅ |
| `:22 (add)` | 추가 | Add | ✅ |
| `:23 (create)` | 생성 | Create | ✅ |
| `:24 (change)` | 변경하기 | Change | ✅ |
| `:25 (refresh)` | 새로고침 | Refresh | ✅ |
| `:26 (retry)` | 다시 시도 | Retry | ✅ |
| `:27 (update)` | 업데이트 | Update | ✅ |
| `:28 (later)` | 나중에 | Later | ✅ |
| `:30 (signOut)` | 로그아웃 | Sign Out | ✅ |
| `:31 (getStarted)` | 시작하기 | Get Started | ✅ |
| `:32 (login)` | 로그인하기 | Log In | ✅ |
| `:33 (home)` | 홈으로 | Go to Home | ❌ needs rework |
| `:35 (restart)` | 재실행 | Restart | ✅ |
| `:36 (stop)` | 중지 | Stop | ✅ |
| `:37 (deactivate)` | 비활성화 | Deactivate | ✅ |
| `:38 (recreate)` | 삭제 후 재생성 | Delete and Recreate | ✅ |
| `:39 (reconnect)` | 재연결 | Reconnect | ✅ |
| `:41 (createTeam)` | 새 팀 만들기 | Create New Team | ❌ needs rework |
| `:42 (createGroup)` | 팀 생성하기 | Create Team | ✅ |
| `:43 (rename)` | 이름 변경 | Rename | ✅ |
| `:44 (deleteTeam)` | 팀 삭제하기 | Delete Team | ✅ |
| `:45 (addMember)` | 멤버 추가하기 | Add Member | ✅ |
| `:46 (addTeam)` | 팀 추가하기 | Add Team | ✅ |
| `:48 (invite)` | 초대하기 | Invite | ✅ |
| `:49 (inviteMember)` | 멤버 초대하기 | Invite Member | ✅ |
| `:50 (sendInvitation)` | 초대 전송 | Send Invitation | ✅ |
| `:51 (resendInvitationCode)` | 초대 코드 재전송 | Resend Invitation Code | ✅ |
| `:52 (cancelInvitation)` | 초대 취소 | Cancel Invitation | ✅ |
| `:53 (cancelAction)` | 취소하기 | Cancel | ✅ |
| `:54 (addTeamRole)` | + 팀/권한 추가 | + Add Team/Role | ✅ |
| `:56 (updateChanges)` | 변경사항 업데이트 | Update Changes | ✅ |
| `:57 (resetChanges)` | 변경사항 초기화 | Reset Changes | ✅ |
| `:58 (deactivateSession)` | 세션 비활성화 | Deactivate Session | ✅ |
| `:59 (deleteMember)` | 멤버 삭제 | Delete Member | ✅ |

### MODAL_TITLES

| Location | Korean | Proposed English | Approved |
|---|---|---|---|
| `:68 (workspaceManage)` | 워크스페이스 관리 | Manage Workspace | ✅ |
| `:69 (workspaceDelete)` | 워크스페이스 삭제 | Delete Workspace | ✅ |
| `:70 (workspaceOrphaned)` | 워크스페이스 재생성 필요 | Workspace Recreation Required | ✅ |
| `:71 (workspaceReconnect)` | 워크스페이스 재연결 필요 | Workspace Reconnection Required | ✅ |
| `:73 (createTeam)` | 새 팀 만들기 | Create New Team | ✅ |
| `:74 (renameTeam)` | 팀 이름 변경 | Rename Team | ✅ |
| `:75 (deleteTeam)` | 팀 삭제 — {teamName} | Delete Team — {teamName} | ✅ |
| `:76 (addMember)` | 멤버 추가 — {teamName} | Add Member — {teamName} | ✅ |
| `:77 (batchFailure)` | 일부 항목을 처리하지 못했습니다 | Some items could not be processed | ✅ |
| `:79 (roleChange)` | 권한 변경 | Change Role | ✅ |
| `:80 (removeMembership)` | 멤버십 제거 | Remove Membership | ✅ |
| `:81 (inviteMember)` | 멤버 초대 | Invite Member | ✅ |
| `:82 (cancelInvitation)` | 초대 취소 | Cancel Invitation | ✅ |
| `:83 (deactivateSession)` | 세션 비활성화 | Deactivate Session | ✅ |
| `:84 (deleteMemberSingle)` | 멤버 삭제 — {account} | Delete Member — {account} | ✅ |
| `:85 (deleteMemberBulk)` | 멤버 삭제 ({count}명) | Delete Members ({count}) (restructure) | ✅ |

### NAV_LIST

| Location | Korean | Proposed English |
|---|---|---|
| `:99` | 팀 관리 | Team Management |
| `:100` | 멤버 관리 | Member Management |
| `:101` | 세션 기록 | Session History |

## 2. Status badges (`constants/styleConstants.ts`)

| Location | Korean | Proposed English | Approved |
|---|---|---|---|
| `:84 (MEMBER_STATUS_VAR.online)` | 온라인 | Online | |
| `:85 (MEMBER_STATUS_VAR.offline)` | 오프라인 | Offline | |
| `:90 (INVITATION_STATUS_VAR.invite_pending)` | 초대 수락 대기 | Invitation Pending | ✅ |
| `:91 (INVITATION_STATUS_VAR.invite_expired)` | 초대 코드 만료 | Invitation Code Expired | ✅ |
| `:92 (INVITATION_STATUS_VAR.invite_redeemed)` | 초대 코드 사용됨 | Invitation code sent | ✅ (reworked) |
| `:96 (WORKSPACE_STATUS_VAR.provisioning)` | 생성 중 | Creating | ✅ |
| `:97 (WORKSPACE_STATUS_VAR.running)` | 실행 중 | Running | |
| `:98 (WORKSPACE_STATUS_VAR.stopping)` | 정지 중 | Stopping | |
| `:99 (WORKSPACE_STATUS_VAR.stopped)` | 정지 | Stopped | |
| `:100 (WORKSPACE_STATUS_VAR.starting)` | 재실행 중 | Restarting | |
| `:101 (WORKSPACE_STATUS_VAR.deleting)` | 삭제 중 | Deleting | |
| `:102 (WORKSPACE_STATUS_VAR.error)` | 사용 불가 | Unavailable | |

## 3. Auth, navigation & shared elements

| Location | Korean | Proposed English |
|---|---|---|
| `components/auth/OwnerLockedNotice.tsx:38` | 사용할 수 없는 계정 | Account Not Available |
| `components/auth/OwnerLockedNotice.tsx:41-47` | 이 콘솔은 {owner}이(가) 관리하고 있어요. | {owner} manages this console. (restructure) |
| `components/auth/OwnerLockedNotice.tsx:45` | 다른 계정 | another account |
| `components/auth/OwnerLockedNotice.tsx:49` | 이 계정으로는 콘솔을 사용할 수 없습니다. | You can't use the console with this account. |
| `pages/LoginPage.tsx:59-61` | 로그인 중 문제가 발생했습니다. / 다시 시도해 주세요. | There was a problem signing in. / Please try again. |
| `pages/LoginPage.tsx:75` | 콘솔을 사용하기 위해 RUNE 계정이 필요합니다. | A RUNE account is required to use the console. |
| `components/navigation/Navbar.tsx:67` | 워크스페이스 | Workspace |
| `components/navigation/Navbar.tsx:74` | 재생성 필요 | Recreation Required |
| `components/navigation/Navbar.tsx:81` | 재연결 필요 | Reconnection Required |
| `components/navigation/Navbar.tsx:92` | 워크스페이스 없음 | No Workspace |
| `components/navigation/ProfileMenu.tsx:62` | 프로필 메뉴 | Profile menu |
| `components/navigation/ProfileMenu.tsx:71` | 프로필 이미지 | Profile image |
| `components/navigation/ProfileMenu.tsx:86` | 플랜: Free | Plan: Free |
| `components/drawer/MembershipRow.tsx:49` | {name} 선택 | Select {name} (restructure) |
| `components/drawer/MembershipRow.tsx:59` | 변경사항 있음 | Unsaved changes |
| `components/elements/Dropdown.tsx:94` | 선택 | Select |
| `components/elements/Pagination.tsx:32` | 페이지네이션 | Pagination |
| `components/elements/Pagination.tsx:36` | 이전 페이지 | Previous page |
| `components/elements/Pagination.tsx:57` | 다음 페이지 | Next page |
| `components/elements/SearchInput.tsx:32` | 검색 | Search |
| `components/elements/SearchInput.tsx:63` | 지우기 | Clear |
| `components/toast/ToastContainer.tsx:36` | 클릭하여 닫기 | Click to dismiss |

## 4. Teams

| Location | Korean | Proposed English |
|---|---|---|
| `components/teams/AddMemberModal.tsx:59` | 이메일 (account) | Email (account) |
| `components/teams/AddMemberModal.tsx:65` | 올바른 이메일 형식이 아닙니다. | Invalid email format. |
| `components/teams/AddMemberModal.tsx:69` | 사용자 이름 (username) | Username |
| `components/teams/AddMemberModal.tsx:70` | 사용자 이름 | Username |
| `components/teams/AddMemberModal.tsx:77` | 권한 (role) | Role |
| `components/teams/AddMemberModal.tsx:78` | 권한 선택 | Select Role |
| `components/teams/AddMemberModal.tsx:84,89` | 초대받은 사용자가 rune을 연결하면 {status}으로 전환됩니다. | Once the invited user connects rune, their status changes to {status}. (restructure) |
| `components/teams/CreateTeamModal.tsx:54`, `RenameTeamModal.tsx:61`, `TreeDetailView.tsx:264` | 같은 상위 팀에 동일한 이름이 이미 있습니다. | A team with this name already exists under the same parent team. |
| `components/teams/CreateTeamModal.tsx:62`, `RenameTeamModal.tsx:69` | 팀 이름 | Team Name |
| `components/teams/CreateTeamModal.tsx:63` | 예: platform-team | e.g. platform-team |
| `components/teams/CreateTeamModal.tsx:71` | 상위 팀 (선택) | Parent Team (Optional) |
| `components/teams/CreateTeamModal.tsx:72`, `DeleteTeamModal.tsx:139` | 팀 선택 | Select Team |
| `components/teams/CreateTeamModal.tsx:78` | 상위 팀을 선택하면 상위 팀의 멤버가 새 팀에 자동 복사됩니다. | Selecting a parent team automatically copies its members to the new team. |
| `components/teams/CreateTeamModal.tsx:79` | 멤버 편집은 팀 생성 후 상세 페이지에서 할 수 있습니다. | You can edit members on the detail page after the team is created. |
| `components/teams/DeleteTeamModal.tsx:72` | 하위 팀이 있는 팀은 삭제할 수 없습니다. | Teams with sub-teams cannot be deleted. |
| `components/teams/DeleteTeamModal.tsx:74` | 하위 팀을 먼저 삭제한 후 다시 시도해 주세요. | Delete the sub-teams first, then try again. |
| `components/teams/DeleteTeamModal.tsx:117` | 삭제하려는 팀의 기억 처리 방식을 선택해 주세요. | Choose how to handle this team's memory before deleting. |
| `components/teams/DeleteTeamModal.tsx:132` | ① 다른 팀으로 이전 | ① Transfer to Another Team |
| `components/teams/DeleteTeamModal.tsx:133` | (기본값) | (Default) |
| `components/teams/DeleteTeamModal.tsx:138` | 이전받을 팀 | Destination Team |
| `components/teams/DeleteTeamModal.tsx:147` | 확인 - 타겟 팀명 입력 | Confirm — Enter Target Team Name |
| `components/teams/DeleteTeamModal.tsx:148` | 팀을 먼저 선택하세요 | Select a team first |
| `components/teams/DeleteTeamModal.tsx:154` | 타겟 팀명이 일치하지 않습니다. | Target team name does not match. |
| `components/teams/DeleteTeamModal.tsx:172` | ② 팀 내 기억 삭제 | ② Delete This Team's Memory |
| `components/teams/DeleteTeamModal.tsx:173` | 다른 팀과 공유 중인 기억은 해당 팀에서 계속 조회할 수 있습니다. | Memories shared with other teams will remain accessible from those teams. |
| `components/teams/DeleteTeamModal.tsx:179` | 확인 - 삭제할 팀명 입력 | Confirm — Enter Team Name to Delete |
| `components/teams/DeleteTeamModal.tsx:185` | 팀명이 일치하지 않습니다. | Team name does not match. |
| `components/teams/OrgChart.tsx:142` | {name} 상세 보기 | View {name} details (restructure) |
| `components/teams/OrgChart.tsx:238` | 축소 | Zoom Out |
| `components/teams/OrgChart.tsx:249` | 확대 | Zoom In |
| `components/teams/RemoveMembershipModal.tsx:40` | 다음 멤버십을 제거합니다: | The following memberships will be removed: |
| `components/teams/RemoveMembershipModal.tsx:44`, `RoleChangeConfirmModal.tsx:42`, `TreeDetailView.tsx:583` | 멤버 이름 | Member Name |
| `components/teams/RemoveMembershipModal.tsx:45` | 팀 | Team |
| `components/teams/RemoveMembershipModal.tsx:46` | 권한 | Role |
| `components/teams/RemoveMembershipModal.tsx:60` | 하위 팀 소속은 유지됩니다. 필요할 경우 개별 선택 후 제거하세요. | Sub-team memberships are kept. Select them individually to remove if needed. |
| `components/teams/RoleChangeConfirmModal.tsx:38` | 다음 멤버의 권한을 변경합니다: | The following members' roles will be changed: |
| `components/teams/RoleChangeConfirmModal.tsx:43` | 권한 변경 | Role Change |
| `components/teams/TreeDetailView.tsx:190,192,193,195` | 없음 | None |
| `components/teams/TreeDetailView.tsx:195` | {count}개 | {count} (restructure) |
| `components/teams/TreeDetailView.tsx:241` | 변경사항이 저장되었습니다. | Changes saved. |
| `components/teams/TreeDetailView.tsx:265` | 팀 이름 형식이 올바르지 않습니다. | Invalid team name format. |
| `components/teams/TreeDetailView.tsx:266` | 하위 팀이 있어 삭제할 수 없습니다. | Cannot delete a team that has sub-teams. |
| `components/teams/TreeDetailView.tsx:276` | 사용자를 찾을 수 없습니다 | User not found |
| `components/teams/TreeDetailView.tsx:277` | 팀 멤버가 아닙니다 | Not a team member |
| `components/teams/TreeDetailView.tsx:281` | 처리에 실패했습니다. 다시 시도해 주세요. | Processing failed. Please try again. |
| `components/teams/TreeDetailView.tsx:287` | 이미 초대된 사용자입니다. | This user has already been invited. |
| `components/teams/TreeDetailView.tsx:288` | 등록되지 않은 계정입니다. | This account is not registered. |
| `components/teams/TreeDetailView.tsx:289` | 콘솔 관리자 계정은 추가할 수 없습니다. | Console admin accounts cannot be added. |
| `components/teams/TreeDetailView.tsx:290` | 초대 코드 전송에 실패했습니다. 다시 시도해 주세요. | Failed to send the invite code. Please try again. |
| `components/teams/TreeDetailView.tsx:309` | 팀 생성 / 팀이 생성되었습니다. | Create Team / Team created. |
| `components/teams/TreeDetailView.tsx:313` | 팀 생성에 실패했습니다. | Failed to create the team. |
| `components/teams/TreeDetailView.tsx:325` | 팀 이름 변경 / 팀 이름이 변경되었습니다. | Rename Team / Team name changed. |
| `components/teams/TreeDetailView.tsx:329` | 이름 변경에 실패했습니다. | Failed to rename the team. |
| `components/teams/TreeDetailView.tsx:344` | 팀 삭제 / 팀이 삭제되었습니다. | Delete Team / Team deleted. |
| `components/teams/TreeDetailView.tsx:353` | 팀 삭제에 실패했습니다. | Failed to delete the team. |
| `components/teams/TreeDetailView.tsx:365` | 멤버 추가 / 멤버를 추가했습니다. | Add Member / Member added. |
| `components/teams/TreeDetailView.tsx:369` | 멤버 추가에 실패했습니다. | Failed to add the member. |
| `components/teams/TreeDetailView.tsx:415` | 권한 변경에 실패했습니다. | Failed to change roles. |
| `components/teams/TreeDetailView.tsx:439` | 멤버십이 제거되었습니다. | Memberships removed. |
| `components/teams/TreeDetailView.tsx:447` | 멤버십 제거에 실패했습니다. | Failed to remove memberships. |
| `components/teams/TreeDetailView.tsx:467` | 팀 트리 | Team Tree |
| `components/teams/TreeDetailView.tsx:511-512` | 상위 팀: {parent} \| 하위 팀: {children} \| 멤버: {count}명 \| 생성일: {date} | Parent team: {parent} \| Sub-teams: {children} \| Members: {count} \| Created: {date} (restructure) |
| `components/teams/TreeDetailView.tsx:517` | 멤버 ({total}) | Members ({total}) |
| `components/teams/TreeDetailView.tsx:560` | 총 {total}명 · {pageSize}명/페이지 | {total} total · {pageSize} per page (restructure) |
| `components/teams/TreeDetailView.tsx:578` | 전체 선택 | Select All |
| `components/teams/TreeDetailView.tsx:584` | 멤버 상태 | Member Status |
| `components/teams/TreeDetailView.tsx:585` | 역할 | Role |
| `components/teams/TreeDetailView.tsx:586` | 합류일 | Joined |
| `components/teams/TreeDetailView.tsx:595` | 불러오는 중… | Loading… |
| `components/teams/TreeDetailView.tsx:600` | 멤버 목록을 불러올 수 없습니다. | Unable to load the member list. |
| `components/teams/TreeDetailView.tsx:609` | 멤버가 없습니다. | No members. |
| `components/teams/TreeDetailView.tsx:623` | {account} 선택 | Select {account} (restructure) |
| `components/teams/teamOptions.ts:8` | 숫자·한글·영어와 - _ 만 사용할 수 있습니다. | Only numbers, Korean and English letters, - and _ are allowed. |
| `components/tree/TeamTree.tsx:65` | 검색 결과가 없습니다. | No search results. |
| `components/tree/TeamTree.tsx:66` | 팀 이름을 다시 확인해 주세요. | Check the team name and try again. |
| `components/tree/TreeNode.tsx:84` | {name} 접기 / {name} 펼치기 | Collapse {name} / Expand {name} (restructure) |

## 5. Members / users

| Location | Korean | Proposed English |
|---|---|---|
| `components/users/CancelInvitationModal.tsx:41` | {account}의 미사용 초대 코드가 모두 만료됩니다. | All unused invitation codes for {account} will expire. (restructure) |
| `components/users/CancelInvitationModal.tsx:42` | 유저는 삭제되지 않습니다. | The user will not be deleted. |
| `components/users/InviteMemberModal.tsx:33 (EMAIL_FORMAT_ERROR)` | 올바른 이메일 형식이 아닙니다 | Please enter a valid email address |
| `components/users/InviteMemberModal.tsx:35 (DUPLICATE_ACCOUNT_ERROR)` | 이미 등록된 계정입니다. 멤버 추가 또는 초대 코드 재전송을 사용하세요. | This account is already registered. Use Add Member or Resend Invitation Code instead. |
| `components/users/InviteMemberModal.tsx:36 (SEND_FAILED_MESSAGE)` | 초대 전송에 실패했습니다. 다시 시도해 주세요. | Failed to send invitation. Please try again. |
| `components/users/InviteMemberModal.tsx:150` | 이메일 (account) | Email (account) |
| `components/users/InviteMemberModal.tsx:164,165` | 사용자 이름 (username) / 사용자 이름 | Username |
| `components/users/InviteMemberModal.tsx:173` | 팀 / 권한 | Team / Role |
| `components/users/InviteMemberModal.tsx:179`, `MemberDetailDrawer.tsx:399` | 팀 선택 | Select team |
| `components/users/InviteMemberModal.tsx:182` | 세트 {n} 팀 | Set {n} team (aria label) |
| `components/users/InviteMemberModal.tsx:188`, `MemberDetailDrawer.tsx:410` | 권한 선택 | Select role |
| `components/users/InviteMemberModal.tsx:191` | 세트 {n} role | Set {n} role (aria label) |
| `components/users/InviteMemberModal.tsx:222` | 하위 팀 권한 미리보기 | Sub-Team Role Preview |
| `components/users/InviteMemberModal.tsx:224` (+ others) | 팀 / 권한 / 사유 | Team / Role / Reason |
| `components/users/InviteMemberModal.tsx:238-244` | 초대 시 사용자에게 초대 코드가 발송되어 사용자가 24시간 내 rune을 연결하면 {status} 으로 전환됩니다. | When invited, the user receives an invitation code; once they connect rune within 24 hours, their status changes to {status}. (restructure) |
| `components/users/InviteMemberModal.tsx:244-245` | 미연결 시 코드가 만료되고 초대 코드 재전송으로 사용자를 다시 초대할 수 있습니다. | If they do not connect, the code expires and you can invite them again with Resend Invitation Code. |
| `components/users/MemberDeleteModal.tsx:9 (DELETE_FAILED_MESSAGE)` | 멤버 삭제에 실패했습니다. 다시 시도해 주세요. | Failed to delete member. Please try again. |
| `components/users/MemberDeleteModal.tsx:24` | 소속된 팀이 없습니다. | Not a member of any team. |
| `components/users/MemberDeleteModal.tsx:91` | {account} 계정을 삭제하며, 아래 팀에서 제거됩니다: | The account {account} will be deleted and removed from the teams below: (restructure) |
| `components/users/MemberDeleteModal.tsx:98` | 다음 멤버의 계정을 삭제하며, 아래 팀에서 제거됩니다: | The following members' accounts will be deleted and removed from the teams below: |
| `components/users/MemberDetailDrawer.tsx:50` | 최근 접속 {date} | Last accessed {date} |
| `components/users/MemberDetailDrawer.tsx:54` | 초대 코드 사용됨 · 연결 대기 중 | Invitation code used · Awaiting connection |
| `components/users/MemberDetailDrawer.tsx:57` | 최근 초대 코드 발송 {datetime} | Last invitation code sent {datetime} |
| `components/users/MemberDetailDrawer.tsx:81 (TEAM_NOT_FOUND)` | 팀을 찾을 수 없습니다 | Team not found |
| `components/users/MemberDetailDrawer.tsx:82 (NOT_TEAM_MEMBER)` | 팀 멤버가 아닙니다 | Not a team member |
| `components/users/MemberDetailDrawer.tsx:86 (BATCH_REASON_FALLBACK)` | 처리에 실패했습니다. 다시 시도해 주세요. | Processing failed. Please try again. |
| `components/users/MemberDetailDrawer.tsx:181,184` | 초대 코드 재전송 / 초대 코드를 재전송했습니다. | Resend Invitation Code / Invitation code resent. |
| `components/users/MemberDetailDrawer.tsx:185` | 초대 코드 재전송에 실패했습니다. 다시 시도해 주세요. | Failed to resend invitation code. Please try again. |
| `components/users/MemberDetailDrawer.tsx:225,230` | 팀 추가 / 팀에 추가되었습니다. | Add Team / Added to team. |
| `components/users/MemberDetailDrawer.tsx:232` | 이미 소속된 팀입니다. | Already a member of this team. |
| `components/users/MemberDetailDrawer.tsx:233` | 팀 추가에 실패했습니다. 다시 시도해 주세요. | Failed to add team. Please try again. |
| `components/users/MemberDetailDrawer.tsx:298` | 소속 팀 ({count}) | Teams ({count}) |
| `components/users/MemberDetailDrawer.tsx:316` | 전체선택 | Select all |
| `components/users/MemberDetailDrawer.tsx:399` | 추가할 팀 없음 | No teams to add |
| `components/users/MemberDetailDrawer.tsx:404` | 추가할 팀 | Team to add |
| `components/users/MemberDetailDrawer.tsx:414` | 추가할 role | Role to add |
| `components/users/MemberDetailDrawer.tsx:436` | 멤버 관리 | Member Management |
| `components/users/MemberDetailDrawer.tsx:523` | 멤버십이 제거되었습니다. | Membership removed. |
| `components/users/MemberDetailDrawer.tsx:564,570` | 세션 비활성화 / 세션을 비활성화했습니다. | Deactivate Session / Session deactivated. |
| `components/users/MemberDetailDrawer.tsx:572` | 이미 만료된 세션입니다. | This session has already expired. |
| `components/users/MemberDetailDrawer.tsx:573` | 세션 비활성화에 실패했습니다. 다시 시도해 주세요. | Failed to deactivate session. Please try again. |
| `components/users/MemberDetailDrawer.tsx:589,595` | 초대 취소 / 초대를 취소했습니다. | Cancel Invitation / Invitation canceled. |
| `components/users/MemberDetailDrawer.tsx:597` | 취소할 초대가 없습니다. | No invitation to cancel. |
| `components/users/MemberDetailDrawer.tsx:598` | 초대 취소에 실패했습니다. 다시 시도해 주세요. | Failed to cancel invitation. Please try again. |
| `components/users/MembershipRemoveModal.tsx:10 (REMOVE_FAILED_MESSAGE)` | 멤버십 제거에 실패했습니다. 다시 시도해 주세요. | Failed to remove membership. Please try again. |
| `components/users/MembershipRemoveModal.tsx:70` | 다음 멤버십을 제거합니다: | The following memberships will be removed: |
| `components/users/MembershipRemoveModal.tsx:81` | 하위 팀 소속은 유지됩니다. 필요할 경우 개별 선택 후 제거하세요. | Sub-team memberships will be kept. Select them individually to remove if needed. |
| `components/users/RoleChangeConfirmModal.tsx:10 (UPDATE_FAILED_MESSAGE)` | 권한 변경에 실패했습니다. 다시 시도해 주세요. | Failed to change role. Please try again. |
| `components/users/RoleChangeConfirmModal.tsx:11 (UPDATE_SUCCESS_MESSAGE)` | 권한이 변경되었습니다. | Role changed. |
| `components/users/RoleChangeConfirmModal.tsx:64` | 다음 멤버의 권한을 변경합니다: | The following members' roles will be changed: |
| `components/users/SessionDeactivateModal.tsx:40` | {account}의 세션을 비활성화하시겠습니까? | Deactivate the session for {account}? (restructure) |
| `components/users/SessionDeactivateModal.tsx:41` | 모든 MCP 세션이 종료됩니다. | All MCP sessions will be terminated. |
| `components/users/invitePreview.ts:42` | 직접 지정 | Directly assigned |
| `components/users/invitePreview.ts:54` | 이미 초대된 팀입니다. | Team already invited. |
| `components/users/invitePreview.ts:55` | {teamName} 하위 팀 | Sub-team of {teamName} (restructure) |

## 6. Workspace

| Location | Korean | Proposed English |
|---|---|---|
| `components/workspace/WorkspaceModal.tsx:28 (FAIL_COPY.stop)` | 워크스페이스 중지에 실패했습니다. 다시 시도해 주세요. | Failed to stop workspace. Please try again. |
| `components/workspace/WorkspaceModal.tsx:29 (FAIL_COPY.restart)` | 워크스페이스 재실행에 실패했습니다. 다시 시도해 주세요. | Failed to restart workspace. Please try again. |
| `components/workspace/WorkspaceModal.tsx:94` | 워크스페이스 재생성에 실패했습니다. 다시 시도해 주세요. | Failed to recreate workspace. Please try again. |
| `components/workspace/WorkspaceModal.tsx:107` | 워크스페이스 삭제에 실패했습니다. 다시 시도해 주세요. | Failed to delete workspace. Please try again. |
| `components/workspace/WorkspaceModal.tsx:116` | 워크스페이스를 삭제하시겠습니까? | Delete this workspace? |
| `components/workspace/WorkspaceModal.tsx:118` | 삭제 후에는 되돌릴 수 없습니다. | This action cannot be undone. |
| `components/workspace/WorkspaceModal.tsx:159` | 기존 워크스페이스를 삭제하는 중입니다… | Deleting the existing workspace… |
| `components/workspace/WorkspaceModal.tsx:161` | 삭제가 완료되면 워크스페이스 생성을 시작합니다. | Workspace creation will start once deletion is complete. |
| `components/workspace/WorkspaceModal.tsx:165` | 콘솔이 재설치되어 이 워크스페이스와 연결할 수 없습니다. | The console was reinstalled and can no longer connect to this workspace. |
| `components/workspace/WorkspaceModal.tsx:167` | 기존에 저장된 데이터는 이전 보안 키로 암호화되어 복구할 수 없습니다. | Previously stored data is encrypted with the old security key and cannot be recovered. |
| `components/workspace/WorkspaceModal.tsx:169` | 삭제 후 재생성하면 빈 워크스페이스로 다시 시작합니다. | Delete and recreate to start over with an empty workspace. |
| `components/workspace/WorkspaceModal.tsx:208` | 워크스페이스 연결이 만료되었습니다. | The workspace connection has expired. |
| `components/workspace/WorkspaceModal.tsx:210` | 재연결하여 데이터 플레인을 다시 활성화해 주세요. | Reconnect to reactivate the data plane. |
| `components/workspace/WorkspaceModal.tsx:213` | 재연결에 실패했습니다. 다시 시도해 주세요. | Failed to reconnect. Please try again. |
| `components/workspace/WorkspaceModal.tsx:242` | 워크스페이스 정보를 불러올 수 없습니다. | Unable to load workspace information. |
| `components/workspace/WorkspaceModal.tsx:244` | 잠시 후 다시 시도해 주세요. | Please try again later. |
| `components/workspace/WorkspaceModal.tsx:289` | 플랜 | Plan |
| `components/workspace/WorkspaceModal.tsx:293` | 상태 | Status |
| `components/workspace/WorkspaceModal.tsx:297` | 저장된 기억 개수 | Stored Memories |
| `pages/WorkspacePage.tsx:65,87` | 워크스페이스 관리 | Workspace management |
| `pages/WorkspacePage.tsx:91` | 워크스페이스를 생성하는 중입니다… | Creating your workspace… |
| `pages/WorkspacePage.tsx:92` | 생성까지 약 3~5분 정도 소요됩니다. | This takes about 3–5 minutes. |
| `pages/WorkspacePage.tsx:98` | 워크스페이스 생성 실패 | Workspace Creation Failed |
| `pages/WorkspacePage.tsx:99` | 워크스페이스를 생성할 수 없습니다. 다시 시도해 주세요. | Couldn't create the workspace. Please try again. |
| `pages/WorkspacePage.tsx:101,109` | 워크스페이스 생성 | Create Workspace |
| `pages/WorkspacePage.tsx:106` | 생성된 워크스페이스가 없습니다. | No workspace has been created. |
| `pages/WorkspacePage.tsx:107` | 워크스페이스를 생성하면 기억(memory)을 저장할 수 있습니다. | Create a workspace to store memory. |

## 7. Pages (sessions, teams, users) & updates

| Location | Korean | Proposed English |
|---|---|---|
| `pages/SessionsPage.tsx:30`, `UsersPage.tsx:79,444` | 멤버 이름 | Member Name |
| `pages/SessionsPage.tsx:31` | 최근 발급 시간 | Last Issued |
| `pages/SessionsPage.tsx:32,140` | 최근 접속 시간 | Last Accessed |
| `pages/SessionsPage.tsx:77,102` | 세션 기록 | Session history |
| `pages/SessionsPage.tsx:84` | 이력 정보를 불러올 수 없습니다. | Couldn't load history. |
| `pages/SessionsPage.tsx:85`, `TeamsPage.tsx:134`, `UsersPage.tsx:290` | 새로고침 후 다시 시도해 주세요. | Refresh and try again. |
| `pages/SessionsPage.tsx:111`, `UsersPage.tsx:357` | 정렬 기준 | Sort by |
| `pages/SessionsPage.tsx:117`, `UsersPage.tsx:363` | 정렬 | Sort |
| `pages/SessionsPage.tsx:124` | 총 {total}건 · {PAGE_SIZE}건/페이지 | {total} total · {PAGE_SIZE} per page (restructure) |
| `pages/SessionsPage.tsx:138` | 사용자 | Users |
| `pages/SessionsPage.tsx:139` | 발급 시간 | Issued At |
| `pages/SessionsPage.tsx:149`, `UsersPage.tsx:455` | 불러오는 중… | Loading… |
| `pages/SessionsPage.tsx:159` | 이력이 없습니다. | No history. |
| `pages/TeamsPage.tsx:19` | 같은 상위 팀에 동일한 이름이 이미 있습니다. | A team with this name already exists under the same parent team. |
| `pages/TeamsPage.tsx:20` | 팀 이름 형식이 올바르지 않습니다. | Invalid team name format. |
| `pages/TeamsPage.tsx:73` | 팀 생성 / 팀이 생성되었습니다. | Create Team / Team created. |
| `pages/TeamsPage.tsx:77` | 팀 생성에 실패했습니다. | Failed to create team. |
| `pages/TeamsPage.tsx:123,130,151` | 팀 관리 | Team management |
| `pages/TeamsPage.tsx:133` | 팀 정보를 불러올 수 없습니다. | Couldn't load teams. |
| `pages/TeamsPage.tsx:153` | 보기 전환 | Switch view |
| `pages/TeamsPage.tsx:162` | 트리·상세 | Tree & Detail |
| `pages/TeamsPage.tsx:172` | 조직도 | Org Chart |
| `pages/TeamsPage.tsx:180` | 팀 검색 | Search teams |
| `pages/TeamsPage.tsx:190` | 새로운 팀을 만들어 주세요. | Create your first team. |
| `pages/TeamsPage.tsx:191` | 팀을 생성하면 멤버와 기억(memory)을 관리할 수 있습니다. | Create a team to manage members and memory. |
| `pages/UsersPage.tsx:62,73` | 전체 | All |
| `pages/UsersPage.tsx:63,64` | 온라인 / 오프라인 | Online / Offline |
| `pages/UsersPage.tsx:78` | 최근 초대 코드 발송 | Last Invitation Code Sent |
| `pages/UsersPage.tsx:96` | 사용자를 찾을 수 없습니다 | User not found |
| `pages/UsersPage.tsx:238` | 초대 코드 재전송 / 초대 코드를 재전송했습니다. | Resend Invitation Code / Invitation code resent. |
| `pages/UsersPage.tsx:242` | 재전송 실패 | Resend failed |
| `pages/UsersPage.tsx:269` | 멤버 삭제 / 멤버를 삭제했습니다. | Delete Members / Members deleted. |
| `pages/UsersPage.tsx:286,309,336` | 멤버 관리 | Member management |
| `pages/UsersPage.tsx:289` | 멤버 정보를 불러올 수 없습니다. | Couldn't load members. |
| `pages/UsersPage.tsx:312` | 아직 초대한 멤버가 없습니다 | No members invited yet |
| `pages/UsersPage.tsx:313` | 멤버를 초대하면 초대 코드가 이메일로 발송됩니다 | Invite a member and an invitation code will be sent by email |
| `pages/UsersPage.tsx:350` | 이름 검색 | Search by name |
| `pages/UsersPage.tsx:368,445` | 멤버 상태 | Member Status |
| `pages/UsersPage.tsx:374` | status 필터 | Status filter |
| `pages/UsersPage.tsx:379` | 팀 | Team |
| `pages/UsersPage.tsx:384` | group 필터 | Team filter |
| `pages/UsersPage.tsx:423` | 총 {total}명 · {PAGE_SIZE}명/페이지 | {total} members · {PAGE_SIZE} per page (restructure) |
| `pages/UsersPage.tsx:439` | 전체 선택 | Select all |
| `pages/UsersPage.tsx:446` | 팀 (권한) | Team (Role) |
| `pages/UsersPage.tsx:465` | 검색 결과가 없습니다. | No results found. |
| `pages/UsersPage.tsx:483` | {account} 선택 | Select {account} (restructure) |
| `components/update/UpdateFloatingCard.tsx:133` | 콘솔을 업데이트하는 중입니다 | Updating the Console |
| `components/update/UpdateFloatingCard.tsx:135` | 업데이트에 실패했습니다 | Update Failed |
| `components/update/UpdateFloatingCard.tsx:136` | 새 버전이 출시되었습니다 | New Version Available |
| `components/update/UpdateFloatingCard.tsx:161` | 백업 및 업데이트를 진행하고 있습니다… | Backing up and updating… |
| `components/update/UpdateFloatingCard.tsx:162` | 업데이트를 준비하고 있습니다… | Preparing the update… |
| `components/update/UpdateFloatingCard.tsx:167` | 업데이트를 완료하지 못했습니다. 상태를 확인한 뒤 다시 시도해 주세요. | The update could not be completed. Check the status and try again. |
| `components/update/UpdateFloatingCard.tsx:171` | 콘솔이 재시작되는 동안 RUNE 사용이 일시적으로 중단될 수 있습니다. | RUNE may be temporarily unavailable while the console restarts. |
| `utils/username.ts:7` | 한글, 영문 소문자, 단어 사이 공백 1칸만 입력할 수 있습니다. | Only Korean, lowercase English letters, and single spaces between words are allowed. |

## 8. Dev-only fixtures (translate last / optional)

`pages/UITestPage.tsx` (~90 strings: component showcase page, not linked in nav)
and `pages/teamsDummyData.ts` (~50 dummy team names: 플랫폼→Platform, 백엔드→Backend,
프론트엔드→Frontend, 디자인→Design, 보안→Security, 인프라→Infrastructure, etc.).
These never render for real users; recommend translating only if we want the
showcase page in English too. Full extraction available on request.

## 9. Korean in code comments only (no UI impact — translate optionally)

- `components/auth/LandingRedirect.tsx:10,13` · `components/elements/Dropdown.tsx:22` · `components/elements/NoticeModal.tsx:11` · `components/elements/SearchInput.tsx:26,27` · `components/elements/TextButton.tsx:20,21` · `components/elements/WorkspaceStatus.tsx:13` · `components/layout/DrawerLayout.tsx:34` · `components/layout/ModalLayout.tsx:17` · `components/navigation/Navbar.tsx:25,58,72,79` · `components/navigation/PublicNavbar.tsx:14` · `components/table/TableFoot.tsx:18`
- `components/teams/*`: AddMemberModal:30 · CreateTeamModal:29 · DeleteTeamModal:46 · OrgChart:57,73,103,177,183 · RemoveMembershipModal:26 · RenameTeamModal:31 · RoleChangeConfirmModal:26,28 · TreeDetailView:103,106,150 · tree/TeamTree:23
- `components/users/*`: CancelInvitationModal:17 · InviteMemberModal:54-57,78 · MemberDeleteModal:15,29,38,40,44 · MemberDetailDrawer:39,41,115,120,350,351,393,439,441,445 · MembershipRemoveModal:26,30 · RoleChangeConfirmModal:17,27,29,31,32 · SessionDeactivateModal:17 · invitePreview:8,22,23
- `components/workspace/WorkspaceModal.tsx:38,49,50,51,101,152` · `api/userAPIs.ts:25`
- `pages/*`: NotFoundPage:12 · SessionsPage:74,100 · TeamsPage:29,44,46,58,83-84,113 · UsersPage:59,283,305 · WorkspacePage:29,31,51
- `hooks/mutations/useUserMembershipMutations.ts:28` · `hooks/mutations/useWorkspaceMutations.ts:17,31,34,37,40,72` · `hooks/queries/useWorkspaceQuery.ts:24` · `stores/noticeStore.ts:13` · `stores/workspaceStore.ts:4,9,10,12,13,17,20` · `types/userTypes.ts:40` · `utils/username.ts:1-2,9`

---

### Notes / decisions to make

1. **Validation rules mentioning Korean**: `teamOptions.ts:8` and `utils/username.ts:7`
   describe regexes that *allow Korean characters*. If the product goes English-first,
   decide whether the validation itself should still accept Hangul (translation above
   keeps the current behavior, just described in English).
2. **"기억 (memory)"**: translated as "memory" throughout (matches RUNE's product term).
3. **"권한" vs "역할"**: both are used for role in Korean; unified as **Role** in English.
4. **초대 코드**: unified as **invitation code** (not "invite code" — one occurrence
   in `TreeDetailView.tsx:290` says "invite code"; change to match if desired).
