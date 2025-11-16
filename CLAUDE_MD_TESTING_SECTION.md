# Testing with MCP-Debugger

## 🧪 Automated Browser Testing

This project is configured with MCP-Debugger for comprehensive browser automation testing.

**MCP Server:** https://mcp-debugger-online-production.up.railway.app
**Configuration:** `.claude/mcp.json`
**Testing Guide:** `.claude/TESTING_GUIDE.md`

### When to Use MCP-Debugger

Use the MCP-Debugger tools in these scenarios:

1. **After Code Changes**
   - Test affected features automatically
   - Verify changes didn't break existing functionality
   - Check for console errors or network failures

2. **Before Deployment**
   - Run comprehensive E2E tests
   - Verify all critical user flows work
   - Measure performance metrics

3. **When User Reports Issues**
   - Reproduce the issue automatically
   - Capture screenshots and diagnostics
   - Identify root cause

4. **Regular Health Checks**
   - Test homepage loads correctly
   - Verify all pages are accessible
   - Check for broken links or errors

### Available Tools (9)

All tools prefixed with `mcp-debugger__`:

- `debug_navigate` - Navigate to URLs, measure load time
- `debug_screenshot` - Capture screenshots → Firebase URLs (not base64!)
- `debug_click` - Click buttons, links, elements
- `debug_type` - Fill form fields, type text
- `debug_console` - Check for console errors/warnings
- `debug_dom_state` - Get page title, URL, HTML content
- `debug_network` - Monitor API calls, check for failures
- `debug_cookies` - Manage authentication cookies
- `debug_analyze_visual` - AI analysis of screenshots (Gemini)

### Testing Guidelines

**Always Be Thorough:**
- ✅ Test complete user journeys (login → action → verify)
- ✅ Take screenshots at each major step
- ✅ Measure performance (page load, interaction delays)
- ✅ Check for console errors after every action
- ✅ Verify network requests succeed
- ✅ Confirm expected content is visible

**Example Test Flow:**
```typescript
1. Navigate to page
2. Wait for load completion
3. Capture initial screenshot
4. Interact with elements (click, type, etc.)
5. Wait for state changes
6. Verify outcome (check DOM, console, network)
7. Capture final screenshot
8. Report results with screenshot URLs
```

### Proactive Testing Behavior

**When I ask you to implement or fix something:**
1. Make the code changes
2. **Automatically test the changes** using MCP-Debugger
3. Verify the feature works end-to-end
4. Check for errors and performance issues
5. Report results with screenshots

**When I ask "does X work?" or "test X":**
1. Read `.claude/TESTING_GUIDE.md` for patterns
2. Create comprehensive test covering all scenarios
3. Execute test using MCP-Debugger tools
4. Capture diagnostics and screenshots
5. Report detailed results

### Critical Testing Patterns

**Authentication Flows:**
- Login → Dashboard → Verify session
- Logout → Verify redirect
- Invalid credentials → Verify error messages

**CRUD Operations:**
- Create → Verify appears in list
- Read → Verify details load correctly
- Update → Verify changes persist
- Delete → Verify removed from list

**Form Validation:**
- Submit empty → Verify validation errors
- Submit invalid → Verify specific error messages
- Submit valid → Verify success

**Performance:**
- Measure page load times (should be < 3 seconds)
- Measure interaction delays (should be < 1 second)
- Identify slow API calls (> 2 seconds)

### Screenshot Best Practices

**All screenshots upload to Firebase Storage and return public URLs:**
- ✅ Never crashes Claude with large base64 images
- ✅ Easy to view in browser
- ✅ Auto-delete after 1 hour (saves storage costs)
- ✅ Perfect for reports and documentation

**When to capture screenshots:**
- Before/after major actions
- On test failures (for debugging)
- When verifying visual layout
- For documentation purposes

### Error Detection

**Always check for errors:**
```typescript
// After every significant action:
const console = await use_mcp_tool("mcp-debugger", "debug_console", {
  filter: "error"
});

const network = await use_mcp_tool("mcp-debugger", "debug_network", {});

// Assert no errors
assert(!console.hasErrors, "No console errors");
assert(network.failedRequests === 0, "No failed API requests");
```

### Session Replays

Every test creates a session on Browserless.io with:
- ✅ 7-day video replay
- ✅ Full timeline of actions
- ✅ Console logs captured
- ✅ Network requests logged

**Access replays:** https://www.browserless.io/account/sessions

### Testing Checklist

Before marking a feature as "done":

- [ ] Code changes implemented
- [ ] Automated test created and run
- [ ] All test steps passed
- [ ] No console errors detected
- [ ] No failed network requests
- [ ] Performance meets thresholds (<3s load, <1s interaction)
- [ ] Screenshots captured for verification
- [ ] Results documented with screenshot URLs

### Common Test Scenarios for This App

**Homepage Load:**
```typescript
1. Navigate to homepage
2. Verify loads in < 3 seconds
3. Check for console errors
4. Verify key elements visible
5. Screenshot for documentation
```

**User Login Flow:**
```typescript
1. Navigate to /login
2. Fill email and password
3. Click submit
4. Verify redirects to dashboard
5. Check session cookie set
6. Screenshot dashboard
7. Verify no errors
```

**Tool Creation (Teachers):**
```typescript
1. Login as teacher
2. Navigate to create tool page
3. Fill tool form (name, description, etc.)
4. Submit form
5. Verify success message
6. Navigate to tools list
7. Verify new tool appears
8. Screenshot for confirmation
```

**Tool Browsing (Students):**
```typescript
1. Navigate to /tools
2. Verify tools load
3. Test search functionality
4. Click on tool card
5. Verify details page loads
6. Check for console errors
7. Measure performance
```

### Performance Thresholds

**For this Replit app:**
- Homepage load: < 3 seconds
- Tools page load: < 4 seconds (more data)
- Click interactions: < 1 second
- Form submissions: < 2 seconds
- API calls: < 2 seconds each

**If thresholds exceeded:**
- Capture screenshot
- Check network requests for slow APIs
- Report performance issue with details

### Integration with Development Workflow

**Standard workflow:**
1. User requests feature/fix
2. Implement code changes
3. **Test immediately with MCP-Debugger**
4. Fix any issues found
5. Re-test until all pass
6. Report completion with test results

**Never say "done" without testing!**

### Quick Testing Command

When you need to test quickly:
```
Test the [feature/page] thoroughly:
1. Navigate and verify load
2. Test all interactions
3. Check for errors
4. Measure performance
5. Capture screenshots
6. Report detailed results
```

### Advanced Testing

**For complex features:**
- Create multi-step test scenarios
- Test error states and edge cases
- Test across different user roles
- Verify accessibility
- Check mobile responsiveness (if applicable)

**Parallel testing:**
- Multiple independent tests can run simultaneously
- Each gets isolated browser session
- Faster test execution

### Reference Documentation

**Full testing guide:** `.claude/TESTING_GUIDE.md`
- Complete tool documentation
- 5 comprehensive testing patterns
- Best practices and examples
- Common mistakes to avoid
- Helper functions and utilities

**Read the guide when:**
- Creating new test scenarios
- Unsure how to test something
- Need advanced testing patterns
- Want to see examples

### Remember

🎯 **Test thoroughly, not superficially**
- Don't just execute actions - verify outcomes
- Don't just check one thing - check everything (console, network, performance)
- Don't assume it works - prove it with evidence (screenshots, metrics)

🚀 **Be proactive about testing**
- Test without being asked
- Test after every change
- Test edge cases and error states
- Test like a real user would use the app

📊 **Provide detailed reports**
- Include screenshot URLs (not base64!)
- Report performance metrics
- List any errors or warnings found
- Summarize pass/fail for each step

---

**Testing is not optional - it's part of completing every task.**
