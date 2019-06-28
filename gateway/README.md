# Pebble Gateway

Connects to Discord and publishes events to and AMQP broker.

## Config

`gateway.toml`

```toml
token = ""
events = ["MESSAGE_CREATE"] # you shouldn't change this unless you know what you're doing

[broker]
url = "amqp://rabbit" # keep this the same if using Docker Compose
```
