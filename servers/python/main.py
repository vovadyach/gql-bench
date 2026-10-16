# FastAPI + Strawberry. One process, one worker: same as the single-process Node servers.
import os

import uvicorn
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter

from schema import schema

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(GraphQLRouter(schema, graphql_ide=None), prefix="/graphql")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3011))
    print(f"[FastAPI+Strawberry] GraphQL ready at http://localhost:{port}/graphql", flush=True)
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        workers=1,
        loop="uvloop",
        http="httptools",
        log_level="warning",
        access_log=False,
    )
