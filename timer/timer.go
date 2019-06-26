package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/spec-tacles/go/broker"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type event struct {
	ID         string          `json:"id"`
	Expiration time.Time       `json:"expiration"`
	Context    json.RawMessage `json:"context"`
}

type manager struct {
	amqp     *broker.AMQP
	mongo    *mongo.Collection
	interval time.Duration
}

func (m *manager) init() (err error) {
	ctx, _ := context.WithTimeout(context.Background(), mongoTimeout)
	cur, err := m.mongo.Find(ctx, bson.M{
		"expiration": bson.M{
			"$lt": time.Now().Add(m.interval),
		},
	})
	if err != nil {
		return
	}
	ctx = context.Background()
	defer cur.Close(ctx)

	for cur.Next(ctx) {
		evt := &event{}
		if err = cur.Decode(evt); err != nil {
			return
		}

		go func() {
			if err := m.queue(evt); err != nil {
				panic(err)
			}
		}()
	}

	return
}

func (m *manager) store(evt *event) error {
	ctx, _ := context.WithTimeout(context.Background(), mongoTimeout)
	_, err := m.mongo.InsertOne(ctx, evt)
	if err != nil {
		return err
	}

	return nil
}

func (m *manager) queue(evt *event) error {
	log.Printf("Will send %s at %v\n", evt.Context, evt.Expiration)
	if evt.Expiration.After(time.Now().Add(m.interval)) {
		return m.store(evt)
	}

	defer func() {
		ctx, _ := context.WithTimeout(context.Background(), mongoTimeout)
		m.mongo.DeleteOne(ctx, bson.M{
			"id": evt.ID,
		})
	}()

	if evt.Expiration.Before(time.Now()) {
		return m.dispatch(evt)
	}

	time.Sleep(evt.Expiration.Sub(time.Now()))
	return m.dispatch(evt)
}

func (m *manager) dispatch(evt *event) (err error) {
	data, err := json.Marshal(evt)
	if err != nil {
		return
	}

	log.Printf("[complete] %s\n", data)
	return m.amqp.Publish("DONE", data)
}

func (m *manager) poll() {
	for range time.Tick(m.interval) {
		m.init()
	}
}
