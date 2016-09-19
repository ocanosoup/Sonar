'use strict';
var queryString = require('querystring');
var accountSid = '';//find this on your twilio profile
var authToken = '';//Also find this ^ there
var fromNumber = "+1";//Plus the rest of the twilio number you're sending from
var toNumber = "+1"; // This will be the number that it goes to when invoked
var message = "";
var https = require('https');
// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    var cardTitle = "Sonar"
    var speechOutput = "You can tell Sonar to text your phone, or text someone else"
    callback(session.attributes,
        buildSpeechletResponse(cardTitle, speechOutput, "", true));
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
    //Intent handlers
    if( intentName === 'AMAZON.StopIntent') {
        finishHandler(intent,session, callback);
    }
    else if (intentName === 'AMAZON.CancelIntent') {
        finishHandler(intent, session, callback);
    }
    else if (intentName === 'TestIntent') {
        handleTestRequest(intent, session, callback);
    }
    else if (intentName == 'CallPhoneIntent') {
        callPhoneRequest(intent,session,callback);
    }
    else if (intentName == 'MessageIntent') {
        SendSMS(toNumber, message, callback);
    }
    else if (intentName == 'noMessageIntent') {
        noMessageHandler(intent, session, callback);
    }
    else if (intentName == 'handleMessageIntent') {
        messageHandler(intent, session, callback) ;
    }
    else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

//business logic here
//For when no message is associated with the intent
function noMessageHandler(intent,session, callback) {
    callback(session.attributes, buildSpeechletResponseWithoutCard("What message should I send?", "", "false"));
}

//When the message
function messageHandler(intent, session, callback) {
    var name = "";
    if(undefined === intent.slots.message.value) {
        callback(session.attributes, buildSpeechletResponseWithoutCard("What message should I send?", "", "false"));
    }
    else message = intent.slots.message.value;
    if(undefined !== intent.slots.recipient.value) {
        name = intent.slots.recipient.value;
        /*var contacts = [
            //in the form {name: 'Name', number: '+1number'},
        ];
        for(var index=0; index<contacts.length; ++index){
          	if(contacts[index].name.toUpperCase() === name.toUpperCase()){
              	toNumber = contacts[index].number;
                name = contacts[index].name;
              	break;
            }
        }*/
        switch(name.toUpperCase()) {
          case "NAME":
              number = "+1number";
              break;
          default:
              callback(session.attributes, buildSpeechletResponseWithoutCard("Not a valid contact", "", "true"));
        }
        //for this style to work I would need the names and numbers of people I intend on texting this way
        //maybe export contact list to vcf then put here? Also would love to have texts sent there to twilio
        //sent back to me even to pseudo message
    }
    SendSMS(toNumber, message, callback);
    /*if(undefined !== intent.slots.type.value) {
        //for when I want to try out voice as well
    }*/
}
function SendSMS(to, body, callback) {

    // The SMS message to send
    var message = {
        To: to,
        From: fromNumber,
        Body: body
    };

    var messageString = queryString.stringify(message);

    // Options and headers for the HTTP request
    var options = {
        host: 'api.twilio.com',
        port: 443,
        path: '/2010-04-01/Accounts/' + accountSid + '/Messages.json',
        method: 'POST',
        headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(messageString),
                    'Authorization': 'Basic ' + new Buffer(accountSid + ':' + authToken).toString('base64')
                 }
    };

    // Setup the HTTP request
    var req = https.request(options, function (res) {

        res.setEncoding('utf-8');

        // Collect response data as it comes back.
        var responseString = '';
        res.on('data', function (data) {
            responseString += data;
        });

        // Log the responce received from Twilio.
        // Or could use JSON.parse(responseString) here to get at individual properties.
        res.on('end', function () {
            console.log('Twilio Response: ' + responseString);

            var parsedResponse = JSON.parse(responseString);

			var sessionAttributes = {};
			var cardTitle = "Sent";
			var speechOutput = "Ok, Sms saying " + body + ". Was sent";

			var repromptText = "";
			var shouldEndSession = true;

			if("queued" === parsedResponse.status){  // we're good, variables already set..
			} else {
			    speechOutput = parsedResponse.message;
			}


			callback(sessionAttributes,
					 buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));


        });
    });

    // Handler for HTTP request errors.
    req.on('error', function (e) {
        console.error('HTTP error: ' + e.message);

		var sessionAttributes = {};
			var cardTitle = "Sent";
			var speechOutput = "Unfortunately, sms request has finished with errors.";

			var repromptText = "";
			var shouldEndSession = true;

			callback(sessionAttributes,
					 buildSpeechletResponseWithoutCard("", callback(speechOutput, "", "true")));

    });

    // Send the HTTP request to the Twilio API.
    // Log the message we are sending to Twilio.
    console.log('Twilio API call: ' + messageString);
    req.write(messageString);
    req.end();

}
function callPhoneRequest(intent, session, callback) {

    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Not yet here, sorry about that", "", "true"));
}
function finishHandler(intent, session, callback) {
    callback(session.attribtues, buildSpeechletResponseWithoutCard("","", "true"));
}
// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
