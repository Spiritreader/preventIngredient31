# [MenSauni](https://mensauni.de)

Alternative Mensa page for Konstanz University

This is the public git repository for the [MenSauni](https://mensauni.de) website, providing menu information for certain university canteens.

MenSauni is built with node.js and javascript.

## Docker

```
docker build -t mensauni .
docker run -d -p 8080:8080 --name mensauni mensauni
```

Or with docker compose:

```bash
docker compose up -d
# or docker-compose up -d
```

The docker image is available on [GitHub](https://github.com/Spiritreader/preventIngredient31/pkgs/container/preventingredient31) with the tag `ghcr.io/spiritreader/preventingredient31:master`
