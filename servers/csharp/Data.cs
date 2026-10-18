// Same fake data as servers/node/src/data.ts: same shapes, texts, counts and random fields.
// These classes are also the GraphQL types: Hot Chocolate exposes their public properties
// in camelCase (AuthorName -> authorName) and enum values in upper case (Admin -> ADMIN).
// `Created` stays a DateTime (like the Node and NestJS servers); `CreatedAt` formats it
// only when a query selects createdAt.
using System.Globalization;

namespace GqlBench;

public enum UserRole
{
    Admin,
    Editor,
    Viewer,
}

public enum PostStatus
{
    Draft,
    Published,
    Archived,
}

// [GraphQLType("ID!")] keeps ids as plain strings ("user-1"); Hot Chocolate's [ID] would
// encode them as global ids
public sealed class Comment
{
    [GraphQLType("ID!")]
    public required string Id { get; init; }
    public required string Body { get; init; }
    public required string AuthorName { get; init; }
    public required int Likes { get; init; }

    [GraphQLIgnore]
    public required DateTime Created { get; init; }
    public string CreatedAt => Data.Iso(Created);
}

public sealed class Post
{
    [GraphQLType("ID!")]
    public required string Id { get; init; }
    public required string Title { get; init; }
    public required string Body { get; init; }
    public required PostStatus Status { get; init; }
    public required List<string> Tags { get; init; }
    public required int ViewCount { get; init; }
    public required double Rating { get; init; }
    public required List<Comment> Comments { get; init; }

    [GraphQLIgnore]
    public required DateTime Created { get; init; }
    public string CreatedAt => Data.Iso(Created);
}

public sealed class UserStats
{
    public required int TotalPosts { get; init; }
    public required int TotalComments { get; init; }
    public required double AvgRating { get; init; }
    public required int TotalViews { get; init; }
}

public sealed class User
{
    [GraphQLType("ID!")]
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
    public required UserRole Role { get; init; }
    public required string Bio { get; init; }
    public required List<Post> Posts { get; init; }
    public required UserStats Stats { get; init; }

    [GraphQLIgnore]
    public required DateTime Created { get; init; }
    public string CreatedAt => Data.Iso(Created);
}

public static class Data
{
    private static readonly long StartMs = Environment.TickCount64;

    private static readonly UserRole[] Roles = [UserRole.Admin, UserRole.Editor, UserRole.Viewer];
    private static readonly PostStatus[] Statuses =
    [
        PostStatus.Published,
        PostStatus.Draft,
        PostStatus.Archived,
    ];
    private static readonly string[] Tags = ["typescript", "nestjs", "graphql", "performance"];
    private static readonly string PostBody = string.Concat(
        Enumerable.Repeat("Lorem ipsum dolor sit amet. ", 20)
    );

    // Same format as JavaScript's toISOString(): 2026-10-13T12:34:56.789Z
    public static string Iso(DateTime utc) =>
        utc.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);

    // Rounds like JavaScript's toFixed (half away from zero), not .NET's default half-to-even
    private static double Round(double value, int digits) =>
        Math.Round(value, digits, MidpointRounding.AwayFromZero);

    public static Comment MakeComment(int id) =>
        new()
        {
            Id = $"comment-{id}",
            Body = $"This is comment #{id} with detailed feedback about the post.",
            AuthorName = $"Commenter_{id % 50}",
            Created = DateTime.UtcNow.AddHours(-id),
            Likes = Random.Shared.Next(100),
        };

    public static Post MakePost(int id, int commentCount) =>
        new()
        {
            Id = $"post-{id}",
            Title = $"Understanding Topic #{id}: A Deep Dive",
            Body = PostBody,
            Status = Statuses[id % 3],
            Tags = Tags.Take(id % 4 + 1).ToList(),
            ViewCount = Random.Shared.Next(10000),
            Rating = Round(Random.Shared.NextDouble() * 5, 1),
            Created = DateTime.UtcNow.AddDays(-id),
            Comments = Enumerable.Range(0, commentCount).Select(i => MakeComment(id * 100 + i)).ToList(),
        };

    public static User MakeUser(int id, int postCount, int commentsPerPost)
    {
        var posts = Enumerable
            .Range(0, postCount)
            .Select(i => MakePost(id + 100 + i, commentsPerPost))
            .ToList();
        return new User
        {
            Id = $"user-{id}",
            Name = $"User_{id}",
            Email = $"user{id}@example.com",
            Role = Roles[id % 3],
            Bio = $"Developer #{id} who builds scalable apps.",
            Created = DateTime.UtcNow.AddDays(-7 * id),
            Posts = posts,
            Stats = new UserStats
            {
                TotalPosts = postCount,
                TotalComments = posts.Sum(p => p.Comments.Count),
                AvgRating = posts.Count > 0 ? Round(posts.Average(p => p.Rating), 2) : 0,
                TotalViews = posts.Sum(p => p.ViewCount),
            },
        };
    }

    public static double CpuWork(int iterations)
    {
        var sum = 0.0;
        for (var i = 0; i < iterations; i++)
        {
            sum += Math.Sin(i) * Math.Cos(i);
        }
        return sum;
    }

    // Millisecond resolution like Node's (Date.now() - startTime) / 1000, so health responses match in size
    public static double Uptime() => (Environment.TickCount64 - StartMs) / 1000.0;
}
