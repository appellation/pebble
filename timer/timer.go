package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/spec-tacles/go/broker"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type event struct {
	ID         primitive.ObjectID `json:"id" bson:"_id"`
	Expiration time.Time          `json:"expiration"`
	Context    json.RawMessage    `json:"context"`
}

type manager struct {
	amqp     *broker.AMQP
	mongo    *mongo.Collection
	nextPoll time.Time
	interval time.Duration
}

func (m *manager) init() (err error) {
	m.nextPoll = time.Now().Add(m.interval)
	ctx, _ := context.WithTimeout(context.Background(), mongoTimeout)
	cur, err := m.mongo.Find(ctx, bson.M{
		"expiration": bson.M{
			"$lt": m.nextPoll,
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
			if err := m.dispatch(evt); err != nil {
				panic(err)
			}
		}()
	}

	return
}

func (m *manager) store(evt *event) error {
	ctx, _ := context.WithTimeout(context.Background(), mongoTimeout)
	res, err := m.mongo.InsertOne(ctx, bson.M{
		"expiration": evt.Expiration,
		"context":    evt.Context,
	})
	evt.ID = res.InsertedID.(primitive.ObjectID)
	return err
}

func (m *manager) queue(evt *event) (err error) {
	if evt.Expiration.Before(time.Now()) {
		return m.dispatch(evt)
	}

	log.Printf("Storing %s for dispatch at %v\n", evt.Context, evt.Expiration)
	if err = m.store(evt); err != nil || evt.Expiration.After(m.nextPoll) {
		return
	}

	return m.dispatch(evt)
}

func (m *manager) dispatch(evt *event) (err error) {
	log.Printf("Will send %s at %v\n", evt.Context, evt.Expiration)

	data, err := json.Marshal(evt)
	if err != nil {
		return
	}

	time.Sleep(evt.Expiration.Sub(time.Now()))

	ctx, _ := context.WithTimeout(context.Background(), mongoTimeout)
	_, err = m.mongo.DeleteOne(ctx, bson.M{
		"_id": evt.ID,
	})
	if err != nil {
		return
	}

	log.Printf("Sending %s\n", evt.Context)
	return m.amqp.Publish("DONE", data)
}

func (m *manager) poll() {
	for range time.Tick(m.interval) {
		m.init()
	}
}
