FROM node:20-bookworm

# Installa LaTeX (semplificato, ma pesante)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      texlive-latex-base \
      texlive-latex-recommended \
      texlive-latex-extra \
      texlive-lang-italian \
      ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

# La cartella data/ verrà montata come volume
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]

