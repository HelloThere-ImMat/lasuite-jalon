FROM oven/bun:1.3

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# prisma.config.ts requires DATABASE_URL to be set, even though generate never connects
RUN DATABASE_URL=postgresql://build@localhost/build bun run db:generate

EXPOSE 3001
CMD ["bun", "run", "dev:docker"]
