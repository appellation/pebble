# Pebble Bot

The main part of the Pebble game system, responsible for running the games and interacting with
Discord as necessary.

## Config

`spectacles.toml`

```toml
prefix = "+"

[discord]
token = ""

[broker]
url = "rabbit" # keep this the same if using Docker Compose
	[broker.groups]
	gateway = "gateway"
	timers = "timers"

[database]
url = "" # the URL to a MongoDB instance/cluster
```
