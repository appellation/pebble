# Timer

A microservice that times things over AMQP.

## Config

`timer.toml`

```toml
[broker]
url = "amqp://rabbit" # keep this the same if using Docker Compose
group = "timers"

[database]
url = "" # the URL to a MongoDB instance/cluster (excluding database name)
name = ""
```

## Usage

Uses the [Spectacles spec](https://github.com/spec-tacles/spec) for communicating over AMQP.

Publish a payload on `START` that conforms to:

```json
{
	"id": "some unique ID (optional)",
	"expiration": "RFC3339 timestamp",
	"context": {
		"any": "extra context"
	}
}
```

Once the server time reaches the specified timestamp, it will publish the same data on `DONE`.
