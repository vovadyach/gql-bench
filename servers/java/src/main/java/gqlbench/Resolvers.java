// Resolvers for schema/benchmark.graphql, mirroring servers/node/src/resolvers.ts:
// same delays, same CPU work, same data. Thread.sleep only parks the request's virtual
// thread, so the one core serves other requests meanwhile (like await in Node).
package gqlbench;

import static gqlbench.Data.*;

import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsMutation;
import com.netflix.graphql.dgs.DgsQuery;
import com.netflix.graphql.dgs.InputArgument;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@DgsComponent
public class Resolvers {
  private static final String ADAPTER = Objects.requireNonNullElse(System.getenv("ADAPTER"), "Unknown");

  private static void sleep(long ms) {
    try {
      Thread.sleep(ms);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  @DgsQuery
  public HealthCheck health() {
    return new HealthCheck("ok", ADAPTER, uptime(), iso(Instant.now()));
  }

  @DgsQuery
  public User user(@InputArgument int id) {
    sleep(1);
    return makeUser(id, 3, 2);
  }

  @DgsQuery
  public PaginatedUsers users(@InputArgument int page, @InputArgument int pageSize) {
    sleep(3);
    List<User> items = new ArrayList<>(pageSize);
    for (int i = 0; i < pageSize; i++) items.add(makeUser((page - 1) * pageSize + i, 3, 2));
    return new PaginatedUsers(items, 100, page, pageSize, page + pageSize < 100);
  }

  @DgsQuery
  public List<User> deepNested(@InputArgument int count) {
    sleep(3);
    cpuWork(10000);
    List<User> users = new ArrayList<>(count);
    for (int i = 0; i < count; i++) users.add(makeUser(i, 10, 8));
    return users;
  }

  @DgsQuery
  public SearchResult search(@InputArgument Map<String, Object> input) {
    long start = System.nanoTime();
    sleep(2);
    cpuWork(10000);
    Integer limitArg = (Integer) input.get("limit");
    int limit = limitArg == null || limitArg == 0 ? 10 : limitArg;
    List<User> users = new ArrayList<>();
    List<Post> posts = new ArrayList<>();
    for (int i = 0; i < Math.min(limit, 20); i++) {
      User u = makeUser(i, 2, 1);
      users.add(u);
      posts.addAll(u.posts());
    }
    posts = posts.subList(0, Math.min(limit, posts.size()));
    double elapsedMs = (System.nanoTime() - start) / 1_000_000.0;
    return new SearchResult(users, posts, users.size() + posts.size(), Math.round(elapsedMs * 100) / 100.0);
  }

  @DgsMutation
  public Post createPost(@InputArgument int userId, @InputArgument Map<String, Object> input) {
    sleep(3);
    @SuppressWarnings("unchecked")
    List<String> tags = (List<String>) input.get("tags");
    return new Post(
        "post-new-" + System.currentTimeMillis(),
        (String) input.get("title"),
        (String) input.get("body"),
        PostStatus.DRAFT,
        tags == null ? List.of() : tags,
        0,
        0,
        List.of(),
        Instant.now());
  }
}
