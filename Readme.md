#Sonar
An Alexa Skill that uses the Twilio API for SMS to send a message from a Twilio number to a contact

###Examples
"Alexa, tell Sonar to text Dave What's up?"  
"Alexa ask Sonar to send Nathan a message saying Gym today?"

###Requirements
  * Twilio account  
  * Twilio AccountSid and Auth Token  
  * Twilio number with SMS capabilities

###Please Take Note
You will need to provide the things noted in requirements in skill.js  
You will also need to provide contacts manually at this stage on line [145]("https://github.com/ocanosoup/Sonar/blob/master/skill.js#L145") of skill.js  
There is a custom slot called [MESSAGE_LIST]("https://github.com/ocanosoup/Bullet/blob/master/speechAssets/QUERY_LIST.txt") filled with phrases  
I used the AMAZON.US_FIRST_NAME built in slot to populate names, this can be extended
for special cases by adding a custom slot and naming it similarly. [More details]("https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interaction-model-reference#h2_extend_types")
