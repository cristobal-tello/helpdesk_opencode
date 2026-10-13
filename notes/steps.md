#4.16
-In this chapter, we install Playright. playright.dev
-Setup playright with a separate database for testing. Do not write any test yet. Just do setup and configuration.
-Show me the plan before run it and I'll accept or not.

-Remember we need to seed the test separate database with an admin user.

-Also, enable rate limiting only in production env, not in test.

#4.18
-create an agent
-write e2e test using Playwright

-move the testing instructions from claude.md into new e2e-test-writer.md

-use e2e-test-writer to write the tests for the login page

-In claude.md, add instructions for using e2e-test-writer.md to writing tests.

#4.19
- Write e2e test for authentication system. Cover all sceneraios and edge cases

Take a look package json and check which test are generated, usually will be:
"test:e2e","test:e2e:ui","test:e2e:headed"

If these test are not there asked IA to do that. Then open a new terminal and run:
$bun run test:e2e

Then you can use npx playwright show-report

Test also:
bun run test:e2e:ui

#4.20
- The test-results directory is created on root and it needs to be created under e2e

#5.2
- Build the user list feature, both client and server (frontend and backend). This new feature needs to be accessible only to admin users.




