# Bug Report Guidelines (Copy into Discord Post Guidelines)

Please use the following template when submitting a bug report. This helps us identify, reproduce, and fix issues faster.

## Template

```
[Title - Brief description of the bug]

**Class:** [App Functionality / UI / Audio Playback / Performance]
**Severity:** [Critical / Major / Minor / Cosmetic]
**Priority:** [High / Medium / Low]

**Summary:**
[Brief description of the bug]

**Actual vs Expected Results:**
- Actual: [What happened]
- Expected: [What should have happened]
- Details: [Additional context]

(Repeat for each distinct issue observed)

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Additional Comments:**
[Screenshots, device/browser info, or any other relevant details]
```

## Tags

### Bug Type (user-applied)
- `App Functionality`
- `UI`
- `Audio Playback`
- `Performance`

### Status (moderator-only)
- `Known Issue`
- `Being Worked On`
- `Resolved`
- `Cannot Reproduce`

## Field Descriptions

- **Class** — The area of the app affected. Use one of the available post tags.
- **Severity** — How bad is the impact?
  - **Critical:** App is unusable, data loss, or crashes
  - **Major:** A core feature is broken but the app still runs
  - **Minor:** Something doesn't work as expected but there's a workaround
  - **Cosmetic:** Visual or text issue, no functional impact
- **Priority** — How urgently should this be addressed?
  - **High:** Needs immediate attention
  - **Medium:** Should be fixed soon
  - **Low:** Can wait, nice-to-have fix

## Example Report

**Title:** Audio cuts out when skipping tracks rapidly

**Class:** Audio Playback
**Severity:** Major
**Priority:** Medium

**Summary:**
Audio playback stops entirely when skipping forward through tracks quickly in succession.

**Actual vs Expected Results:**
- Actual: After skipping 4-5 tracks rapidly, audio goes silent and the play button shows "playing" but no sound comes out.
- Expected: Each skipped track should begin playing immediately, or at minimum playback should resume on the final track.
- Details: Tested on Chrome 126, Windows 11. Volume slider still shows active output.

**Steps to Reproduce:**
1. Start playing any album
2. Rapidly click the skip-forward button 4-5 times within ~2 seconds
3. Observe that audio stops on the final track

**Additional Comments:**
See image #1. Happens consistently. Refreshing the page fixes it.
