// Resolvers for schema/benchmark.graphql, mirroring servers/node/src/resolvers.ts:
// same delays, same CPU work, same data.
package graph

import (
	"context"
	"fmt"
	"math"
	"os"
	"time"

	"gqlbench/graph/model"
)

type Resolver struct{}

var adapter = func() string {
	if a := os.Getenv("ADAPTER"); a != "" {
		return a
	}
	return "Unknown"
}()

// CreatePost is the resolver for the createPost field.
func (r *mutationResolver) CreatePost(ctx context.Context, userID int, input model.CreatePostInput) (*model.Post, error) {
	time.Sleep(3 * time.Millisecond)
	tags := input.Tags
	if tags == nil {
		tags = []string{}
	}
	return &model.Post{
		ID:       fmt.Sprintf("post-new-%d", time.Now().UnixMilli()),
		Title:    input.Title,
		Body:     input.Body,
		Status:   model.PostStatusDraft,
		Tags:     tags,
		Comments: []*model.Comment{},
		Created:  time.Now(),
	}, nil
}

// Health is the resolver for the health field.
func (r *queryResolver) Health(ctx context.Context) (*model.HealthCheck, error) {
	return &model.HealthCheck{
		Status:        "ok",
		Adapter:       adapter,
		UptimeSeconds: model.Uptime(),
		Timestamp:     model.Iso(time.Now()),
	}, nil
}

// User is the resolver for the user field.
func (r *queryResolver) User(ctx context.Context, id int) (*model.User, error) {
	time.Sleep(1 * time.Millisecond)
	return model.MakeUser(id, 3, 2), nil
}

// Users is the resolver for the users field.
func (r *queryResolver) Users(ctx context.Context, page int, pageSize int) (*model.PaginatedUsers, error) {
	time.Sleep(3 * time.Millisecond)
	items := make([]*model.User, pageSize)
	for i := range items {
		items[i] = model.MakeUser((page-1)*pageSize+i, 3, 2)
	}
	return &model.PaginatedUsers{Items: items, Total: 100, Page: page, PageSize: pageSize, HasMore: page+pageSize < 100}, nil
}

// DeepNested is the resolver for the deepNested field.
func (r *queryResolver) DeepNested(ctx context.Context, count int) ([]*model.User, error) {
	time.Sleep(3 * time.Millisecond)
	model.CpuWork(10000)
	users := make([]*model.User, count)
	for i := range users {
		users[i] = model.MakeUser(i, 10, 8)
	}
	return users, nil
}

// Search is the resolver for the search field.
func (r *queryResolver) Search(ctx context.Context, input model.SearchInput) (*model.SearchResult, error) {
	start := time.Now()
	time.Sleep(2 * time.Millisecond)
	model.CpuWork(10000)
	limit := 10
	if input.Limit != nil && *input.Limit != 0 {
		limit = *input.Limit
	}
	users := make([]*model.User, min(limit, 20))
	posts := []*model.Post{}
	for i := range users {
		users[i] = model.MakeUser(i, 2, 1)
		posts = append(posts, users[i].Posts...)
	}
	posts = posts[:min(limit, len(posts))]
	elapsed := float64(time.Since(start).Microseconds()) / 1000
	return &model.SearchResult{
		Users:        users,
		Posts:        posts,
		TotalResults: len(users) + len(posts),
		QueryTimeMs:  math.Round(elapsed*100) / 100,
	}, nil
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

type (
	mutationResolver struct{ *Resolver }
	queryResolver    struct{ *Resolver }
)
