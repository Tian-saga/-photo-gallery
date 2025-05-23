## Distributed Systems - Event-Driven Architecture.

__Name:__ ....Zitian Zhong .....

__Demo__: ....[https://youtu.be/_oYb_lsrWHs] ......

This repository contains the implementation of a skeleton design for an application that manages a photo gallery, illustrated below. The app uses an event-driven architecture and is deployed on the AWS platform using the CDK framework for infrastructure provisioning.

![](./images/arch.png)

### Code Status.

[Advice: In this section, state the status of your submission for each feature listed below. The status options are: (1) Completed & Tested; (2) Attempted (i.e. partially works); (3) Not Attempted. Option (1) implies the feature performs the required action (e.g. updates the table) __only when appropriate__, as dictated by the relevant filtering policy described in the specification.]

__Feature:__
+ Photographer:
  + Log new Images – Completed & Tested  
  + Metadata updating – Completed & Tested  
  + Invalid image removal  – Completed & Tested  
  + Status Update Mailer  – Attempted  
+ Moderator
  + Status updating – Completed & Tested  
+ Cross-cutting features:
  + Filtering  – Completed & Tested  
  + Messaging – Attempted  
  



### Notes (Optional)

- Valid `.jpeg`/`.png` uploads generate DynamoDB items; invalid uploads are thrown to DLQ.
- CLI-published SNS messages with `metadata_type` attributes (`Caption`, `Date`, `name`) correctly update the DynamoDB item.
- The Remove-Image Lambda consumes from DLQ and deletes bad-extension objects from S3.
- Update-Status Lambda writes `status` + `reason` + `reviewDate` to DynamoDB and publishes a “mailer” message attribute.  
- SES mailer Lambda is wired up but email delivery not yet 
  verified.
- CLI-published SNS messages trigger the Update-Status Lambda, which updates DynamoDB and logs the change.
- SNS subscription filter policies ensure only metadata messages reach Add-Metadata, only status messages reach Update-Status, and only mailer messages reach the Mailer 
  Lambda.
- SNS publish/subscribe chain works end-to-end; SES integration pending final verification.

- SES requires a verified “From” address and for recipient addresses to be verified in sandbox. Mailer Lambda logs show correct message construction but no deliveries until SES sandbox restrictions are lifted.
- To demo locally, set environment variables for `BUCKET`, `TABLE`, and `TOPIC_ARN` from the CDK stack outputs, then run the sample `aws sns publish` and `aws s3 cp` commands in sequence to exercise each Lambda.
- The CDK constructs can be easily extended to add additional metadata types or to switch SES to production mode once sandbox is exited.
