package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/spec-tacles/go/broker"
	"github.com/spec-tacles/go/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type conf struct {
	config.Config
	Database struct {
		URL  string
		Name string
	}
	Broker struct {
		URL   string
		Group string
	}
}

const mongoTimeout = 5 * time.Second

func main() {
	c := &conf{}
	_, err := toml.DecodeFile("timer.toml", c)
	if err != nil {
		panic(err)
	}

	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(c.Database.URL))
	if err != nil {
		panic(err)
	}

	collection := client.Database(c.Database.Name).Collection("timers")

	var mgr *manager
	amqp := broker.NewAMQP(c.Broker.Group, "", func(_ string, body []byte) {
		req := &event{}
		if err := json.Unmarshal(body, req); err != nil {
			panic(err)
		}

		if err := mgr.queue(req); err != nil {
			panic(err)
		}
	})

	if err = amqp.Connect(c.Broker.URL); err != nil {
		panic(err)
	}

	mgr = &manager{amqp, collection, time.Time{}, 1 * time.Minute}
	if err = mgr.init(); err != nil {
		panic(err)
	}

	go mgr.poll()
	log.Println()
	amqp.Subscribe("START")
}
