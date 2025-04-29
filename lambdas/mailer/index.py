import os
import json
import boto3
import logging


ses  = boto3.client('ses', region_name=os.environ.get('AWS_REGION', 'eu-west-1'))
FROM = os.environ['MAIL_FROM']  

log = logging.getLogger()
log.setLevel(logging.INFO)

def handler(event, _):
    for rec in event['Records']:
        sns_rec = rec['Sns']
        attrs   = sns_rec.get('MessageAttributes', {})

     
        if attrs.get('mailer', {}).get('Value') != 'true':
            log.debug('skipping non-mailer msg')
            continue

      
        item = json.loads(sns_rec['Message'])
        
      
        email = attrs.get('email', {}).get('Value') or item.get('Email')
        if not email:
            log.warning('No email address found for %s, skipping', item.get('id'))
            continue

       
        try:
            ses.send_email(
                Source=FROM,
                Destination={'ToAddresses': [email]},
                Message={
                    'Subject': {'Data': f"Your photo {item['id']} status updated"},
                    'Body': {
                        'Text': {'Data': (
                            f"Photo ID: {item['id']}\n"
                            f"Status: {item.get('status')}\n"
                            f"Reason: {item.get('reason','-')}\n"
                            f"Review Date: {item.get('reviewDate','-')}"
                        )}
                    }
                }
            )
            log.info('SES mail sent to %s', email)
        except Exception as e:
            log.error('Failed to send SES mail to %s: %s', email, e, exc_info=True)
