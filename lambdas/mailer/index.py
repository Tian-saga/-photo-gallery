import os, json, boto3, logging
ses  = boto3.client('ses')
FROM = os.environ['MAIL_FROM']

log = logging.getLogger()
log.setLevel(logging.INFO)

def handler(event, _):
    for rec in event['Records']:
        sns_rec = rec['Sns']
        attrs   = sns_rec.get('MessageAttributes', {})


        if attrs.get('mailer', {}).get('Value') != 'true':
            continue

        item = json.loads(sns_rec['Message'])
      
        email = attrs.get('email', {}).get('Value') or item.get('Email')
        if not email:
            log.warning('No email for %s', item['id'])
            continue

        ses.send_email(
            Source=FROM,
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': 'Photo status updated'},
                'Body': {
                    'Text': {'Data': (
                        f"Your photo {item['id']} is {item['status']}.\n"
                        f"Reason: {item.get('reason','-')}"
                    )}
                }
            }
        )
        log.info('mail sent to %s', email)
