import os
import json
import boto3
import logging


table = boto3.resource('dynamodb').Table(os.environ['TABLE'])


log = logging.getLogger()
log.setLevel(logging.INFO)


VALID = {"Caption","Date","name","Email"}


def handler(event, context):
    for record in event.get("Records", []):
        sns_rec = record["Sns"]

   
        log.info("RAW MESSAGE: %s", sns_rec["Message"])

     
        body = json.loads(sns_rec["Message"])
        meta = sns_rec["MessageAttributes"]["metadata_type"]["Value"]

   
        if meta not in VALID:
            raise ValueError(f"Invalid metadata_type: {meta}")

      
        table.update_item(
            Key={"id": body["id"]},
            UpdateExpression="SET #field = :value",
            ExpressionAttributeNames={"#field": meta},
            ExpressionAttributeValues={":value": body["value"]}
        )

        log.info("Metadata added: %s = %s", meta, body["value"])
