// chi + gqlgen. One process on one thread (GOMAXPROCS=1), like the single-threaded Node servers.
package main

import (
	"fmt"
	"net/http"
	"os"
	"runtime"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/go-chi/chi/v5"
	"github.com/vektah/gqlparser/v2/ast"

	"gqlbench/graph"
)

func main() {
	// Go code runs on one core, like Node's single JavaScript thread. Go would use every core by default
	runtime.GOMAXPROCS(1)

	// What gqlgen's default server sets up, minus websockets and persisted queries: parsed queries
	// are cached, like Mercurius, Yoga and Apollo do. No playground page, like graphiql: false (Node)
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: &graph.Resolver{}}))
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))
	srv.Use(extension.Introspection{})

	// No request logging middleware, like the other servers
	r := chi.NewRouter()
	r.Handle("/graphql", srv)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3013"
	}
	fmt.Printf("[chi+gqlgen] GraphQL ready at http://localhost:%s/graphql\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
