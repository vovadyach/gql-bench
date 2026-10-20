// Same fake data as servers/node/src/data.ts: same shapes, texts, counts and random fields.
// These structs are also the GraphQL types (gqlgen binds them by name). `Created` stays a
// time.Time (like the Node and NestJS servers); the CreatedAt method formats it only when a
// query selects createdAt.
package model

import (
	"fmt"
	"math"
	"math/rand/v2"
	"strings"
	"time"
)

type Comment struct {
	ID         string
	Body       string
	AuthorName string
	Likes      int
	Created    time.Time
}

func (c *Comment) CreatedAt() string { return Iso(c.Created) }

type Post struct {
	ID        string
	Title     string
	Body      string
	Status    PostStatus
	Tags      []string
	ViewCount int
	Rating    float64
	Comments  []*Comment
	Created   time.Time
}

func (p *Post) CreatedAt() string { return Iso(p.Created) }

type UserStats struct {
	TotalPosts    int
	TotalComments int
	AvgRating     float64
	TotalViews    int
}

type User struct {
	ID      string
	Name    string
	Email   string
	Role    UserRole
	Bio     string
	Posts   []*Post
	Stats   *UserStats
	Created time.Time
}

func (u *User) CreatedAt() string { return Iso(u.Created) }

var (
	startTime = time.Now()
	roles     = []UserRole{UserRoleAdmin, UserRoleEditor, UserRoleViewer}
	statuses  = []PostStatus{PostStatusPublished, PostStatusDraft, PostStatusArchived}
	tags      = []string{"typescript", "nestjs", "graphql", "performance"}
	postBody  = strings.Repeat("Lorem ipsum dolor sit amet. ", 20)
)

// Same format as JavaScript's toISOString(): 2026-10-13T12:34:56.789Z
func Iso(t time.Time) string { return t.UTC().Format("2006-01-02T15:04:05.000Z") }

// Rounds like JavaScript's toFixed for these positive values (half away from zero)
func round(v float64, digits int) float64 {
	p := math.Pow(10, float64(digits))
	return math.Round(v*p) / p
}

func MakeComment(id int) *Comment {
	return &Comment{
		ID:         fmt.Sprintf("comment-%d", id),
		Body:       fmt.Sprintf("This is comment #%d with detailed feedback about the post.", id),
		AuthorName: fmt.Sprintf("Commenter_%d", id%50),
		Likes:      rand.IntN(100),
		Created:    time.Now().Add(-time.Duration(id) * time.Hour),
	}
}

func MakePost(id, commentCount int) *Post {
	comments := make([]*Comment, commentCount)
	for i := range comments {
		comments[i] = MakeComment(id*100 + i)
	}
	return &Post{
		ID:        fmt.Sprintf("post-%d", id),
		Title:     fmt.Sprintf("Understanding Topic #%d: A Deep Dive", id),
		Body:      postBody,
		Status:    statuses[id%3],
		Tags:      tags[:id%4+1],
		ViewCount: rand.IntN(10000),
		Rating:    round(rand.Float64()*5, 1),
		Comments:  comments,
		Created:   time.Now().Add(-time.Duration(id) * 24 * time.Hour),
	}
}

func MakeUser(id, postCount, commentsPerPost int) *User {
	posts := make([]*Post, postCount)
	totalViews, totalComments, ratingSum := 0, 0, 0.0
	for i := range posts {
		p := MakePost(id+100+i, commentsPerPost)
		posts[i] = p
		totalViews += p.ViewCount
		totalComments += len(p.Comments)
		ratingSum += p.Rating
	}
	avgRating := 0.0
	if postCount > 0 {
		avgRating = round(ratingSum/float64(postCount), 2)
	}
	return &User{
		ID:      fmt.Sprintf("user-%d", id),
		Name:    fmt.Sprintf("User_%d", id),
		Email:   fmt.Sprintf("user%d@example.com", id),
		Role:    roles[id%3],
		Bio:     fmt.Sprintf("Developer #%d who builds scalable apps.", id),
		Posts:   posts,
		Stats:   &UserStats{TotalPosts: postCount, TotalComments: totalComments, AvgRating: avgRating, TotalViews: totalViews},
		Created: time.Now().Add(-time.Duration(id) * 7 * 24 * time.Hour),
	}
}

// Same loop as cpuWork in servers/node/src/data.ts
func CpuWork(iterations int) float64 {
	sum := 0.0
	for i := 0; i < iterations; i++ {
		sum += math.Sin(float64(i)) * math.Cos(float64(i))
	}
	return sum
}

// Millisecond resolution like Node's (Date.now() - startTime) / 1000, so health responses match in size
func Uptime() float64 { return float64(time.Since(startTime).Milliseconds()) / 1000 }
