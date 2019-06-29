# Pebble

A Discord bot that allows you to play fibbage-esque games with other people in your Discord server.

https://discordapp.com/api/oauth2/authorize?client_id=592062477252952075&permissions=0&scope=bot

## Installation

1. Add a configuration file to each of the services as described in their respective README files.
2. Boot each service. We highly recommend using Docker Compose for this.

## Usage

| Command | Description |
|---------|------------------------------------------------------------------------------------------------------------|
| create | Creates a game in your channel. Waits 2 minutes before starting. |
| start | Starts the game in your channel if you don't want to wait 2 minutes. Can only be used by the game creator. |
| join | Joins a game in your channel. You can use this at any time. |
| stop | Ends the game that's running in your channel. Can only be used by the game creator. |
| submit | Submits a question and answer (optional, `|` seperated) that will be decided worthy by Pebble's members. |

### Contributors
- appellation#7852
- Dim#4657
- nomsy#2000
