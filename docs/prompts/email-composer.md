as an admin, I need to ability to bulk send emails to everyone in my course. │
│ add another option in the admin dropdown menu in the header called "emails" │
│ which will allow a user to start writing emails. try to use react-email for │
│ crafting the emails. the admin should be able to see a preview of the email and │
│ also a button for sending out a test email (opens a dialog and have a single │
│ input field for the destination email)\ │
│ \ │
│ all of this should use aws ses. create a infra directory and any .sh scripts │
│ necessary to setup my aws account with ses and the proper email domain. also │
│ setup a script I can use to create a user and an aws access key I'll need to add │
│ to my deployed service. this user should only have ses permissions, so include │
│ a way to use a permissions.json to set that up.\ │
│ \ │
│ when sending out the emails, remember to batch them to only do 5 emails a second │
│ so that I don't get rate limited in ses. This should be a backend process, so │
│ the server function used to run this logic should just return early but have an │
│ unresolved promise to start sending the emails.\ │
│ \ │
│ the email composer should be intuative and have good ux. make sure this page │
│ follows the theme of my current application pages, including client side │
│ validation using react-hook-form, uses shadcn components when possible, and │
│ shows toasts when client side errors happen. There should be a progress bar to │
│ track the progress of the emails. to achieve this, you probably need a new │
│ table called "emailBatches" or something else so I can track when I kicked off a │
│ batch email. Be sure to track how many have sent and how many are remaining, │
│ ttrack the email template and compiled html used.\\ │
│ \ │
│ For a user, add the ability for them to go to a settings page which allows them │
│ to configure email notifications and opt out of getting emails when new course │
│ content is released. │
│ \ │
│ think hard to help me plan this feature out and add or change anything you think │
│ is necessary to achieve this email compose feature for admins. at the end, │
│ kick off the @agent-feature-docs-updater to track this new feature.
