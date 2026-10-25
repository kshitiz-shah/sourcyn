"""Main FastAPI application entry point."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, Any
from fastapi import FastAPI, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import get_logger, setup_logging

logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifespan management."""
    setup_logging(settings.LOG_LEVEL)
    logger.info("Starting up %s in %s environment...", settings.PROJECT_NAME, settings.ENVIRONMENT)
    try:
        yield
    finally:
        logger.info("Shutting down %s...", settings.PROJECT_NAME)


def create_application() -> FastAPI:
    """Application factory for FastAPI."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # Set up CORS middleware
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Production Hardening: Security Headers & Rate Limiting
    from app.core.security import SecurityHeadersMiddleware, RateLimitMiddleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware)

    @app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
    async def health_check() -> JSONResponse:
        """System health and operational status check."""
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "healthy",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "service": "api",
                "environment": settings.ENVIRONMENT,
                "version": "0.1.0",
            },
        )

    # Mount v1 REST API routes
    from app.api.v1.api import api_router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Mount Single Page Application (SPA) if frontend build exists
    import os
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    possible_dist_dirs = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static")),
        "/app/frontend/dist",
    ]
    dist_dir = next((d for d in possible_dist_dirs if os.path.isdir(d) and os.path.exists(os.path.join(d, "index.html"))), None)

    if dist_dir:
        assets_dir = os.path.join(dist_dir, "assets")
        if os.path.isdir(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{full_path:path}")
        async def serve_spa(request: Request, full_path: str):
            if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path == "openapi.json":
                return JSONResponse(status_code=404, content={"detail": "Not Found"})
            # Return JSON metadata if not a browser navigation requesting HTML at root
            accept = request.headers.get("accept", "")
            if not full_path and "text/html" not in accept:
                return JSONResponse(content={
                    "name": settings.PROJECT_NAME,
                    "version": "0.1.0",
                    "environment": settings.ENVIRONMENT,
                    "docs": f"{settings.API_V1_STR}/docs",
                    "status": "operational",
                })
            target_file = os.path.join(dist_dir, full_path)
            if full_path and os.path.isfile(target_file):
                return FileResponse(target_file)
            return FileResponse(os.path.join(dist_dir, "index.html"))
    else:
        @app.get("/", tags=["Root"])
        async def root_info() -> Dict[str, Any]:
            """Root API welcome & system information."""
            return {
                "name": settings.PROJECT_NAME,
                "version": "0.1.0",
                "environment": settings.ENVIRONMENT,
                "docs": f"{settings.API_V1_STR}/docs",
                "status": "operational",
            }

    return app


app = create_application()
