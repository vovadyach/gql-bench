// ASP.NET Core + Hot Chocolate. One process, like the single-process Node and Python servers;
// GqlBench.csproj keeps it on one thread pool thread.
var builder = WebApplication.CreateBuilder(args);

// Warnings and errors only: no per-request logs, like the Node servers and uvicorn's log_level="warning"
builder.Logging.SetMinimumLevel(LogLevel.Warning);

// Hot Chocolate's default security rules (cost analysis, introspection off outside development,
// a field-cycle depth rule) are off: the Node and Python servers run none of them
builder.AddGraphQL(disableDefaultSecurity: true).AddTypes();

var app = builder.Build();

// No Nitro IDE page, like graphiql: false (Node) and graphql_ide=None (Python)
app.MapGraphQL().WithOptions(options => options.Tool.Enable = false);

var port = Environment.GetEnvironmentVariable("PORT") ?? "3012";
app.Urls.Add($"http://0.0.0.0:{port}");
app.Lifetime.ApplicationStarted.Register(() =>
    Console.WriteLine($"[ASP.NET Core+Hot Chocolate] GraphQL ready at http://localhost:{port}/graphql")
);

app.Run();
