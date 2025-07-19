# Multi-stage build para otimização
FROM nginx:alpine

# Metadados da imagem
LABEL maintainer="rogersonoliveira"
LABEL version="2.0.0"
LABEL description="DevOps Advanced App com health checks"

# Cria usuário não-root por segurança
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Instala dependências necessárias
RUN apk add --no-cache \
    curl \
    jq \
    bash

# Remove arquivos padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia arquivos da aplicação
COPY index.html /usr/share/nginx/html/
COPY health-check.html /usr/share/nginx/html/health
COPY nginx.conf /etc/nginx/nginx.conf

# Define permissões corretas
RUN chown -R appuser:appgroup /usr/share/nginx/html/ && \
    chown -R appuser:appgroup /var/cache/nginx/ && \
    chown -R appuser:appgroup /var/log/nginx/ && \
    chown -R appuser:appgroup /etc/nginx/conf.d/ && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

# Expõe porta
EXPOSE 80

# Muda para usuário não-root
USER appuser

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]