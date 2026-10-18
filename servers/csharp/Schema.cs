// Hot Chocolate version of schema/benchmark.graphql. Resolvers mirror servers/node/src/resolvers.ts:
// same delays, same CPU work, same data. Hot Chocolate builds the schema from these classes and
// methods (GetUserAsync -> user, CreatePostAsync -> createPost, PageSize -> pageSize).
using System.Diagnostics;

// Names the generated registration method: AddTypes() in Program.cs
[assembly: Module("Types")]

namespace GqlBench;

public sealed class HealthCheck
{
    public required string Status { get; init; }
    public required string Adapter { get; init; }
    public required double UptimeSeconds { get; init; }
    public required string Timestamp { get; init; }
}

public sealed class PaginatedUsers
{
    public required List<User> Items { get; init; }
    public required int Total { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public required bool HasMore { get; init; }
}

public sealed class SearchResult
{
    public required List<User> Users { get; init; }
    public required List<Post> Posts { get; init; }
    public required int TotalResults { get; init; }
    public required double QueryTimeMs { get; init; }
}

public sealed class CreatePostInput
{
    public required string Title { get; init; }
    public required string Body { get; init; }
    public List<string>? Tags { get; init; }
}

public sealed class SearchInput
{
    public required string Query { get; init; }

    // Nullable with a default, as in the shared schema; Hot Chocolate alone would make it Int! = 10
    [GraphQLType("Int")]
    [DefaultValue(10)]
    public int? Limit { get; init; }
}

[QueryType]
public static partial class Query
{
    private static readonly string Adapter =
        Environment.GetEnvironmentVariable("ADAPTER") ?? "Unknown";

    public static HealthCheck GetHealth() =>
        new()
        {
            Status = "ok",
            Adapter = Adapter,
            UptimeSeconds = Data.Uptime(),
            Timestamp = Data.Iso(DateTime.UtcNow),
        };

    public static async Task<User> GetUserAsync(int id = 1)
    {
        await Task.Delay(1);
        return Data.MakeUser(id, 3, 2);
    }

    public static async Task<PaginatedUsers> GetUsersAsync(int page = 1, int pageSize = 10)
    {
        await Task.Delay(3);
        var items = Enumerable
            .Range(0, pageSize)
            .Select(i => Data.MakeUser((page - 1) * pageSize + i, 3, 2))
            .ToList();
        return new PaginatedUsers
        {
            Items = items,
            Total = 100,
            Page = page,
            PageSize = pageSize,
            HasMore = page + pageSize < 100,
        };
    }

    public static async Task<List<User>> GetDeepNestedAsync(int count = 5)
    {
        await Task.Delay(3);
        Data.CpuWork(10000);
        return Enumerable.Range(0, count).Select(i => Data.MakeUser(i, 10, 8)).ToList();
    }

    public static async Task<SearchResult> SearchAsync(SearchInput input)
    {
        var start = Stopwatch.GetTimestamp();
        await Task.Delay(2);
        Data.CpuWork(10000);
        var limit = input.Limit is null or 0 ? 10 : input.Limit.Value;
        var users = Enumerable.Range(0, Math.Min(limit, 20)).Select(i => Data.MakeUser(i, 2, 1)).ToList();
        var posts = users.SelectMany(u => u.Posts).Take(limit).ToList();
        return new SearchResult
        {
            Users = users,
            Posts = posts,
            TotalResults = users.Count + posts.Count,
            QueryTimeMs = Math.Round(
                Stopwatch.GetElapsedTime(start).TotalMilliseconds,
                2,
                MidpointRounding.AwayFromZero
            ),
        };
    }
}

[MutationType]
public static partial class Mutation
{
    public static async Task<Post> CreatePostAsync(int userId, CreatePostInput input)
    {
        await Task.Delay(3);
        return new Post
        {
            Id = $"post-new-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Title = input.Title,
            Body = input.Body,
            Status = PostStatus.Draft,
            Tags = input.Tags ?? [],
            ViewCount = 0,
            Rating = 0,
            Created = DateTime.UtcNow,
            Comments = [],
        };
    }
}
