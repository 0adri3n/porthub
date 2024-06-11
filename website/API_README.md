
# Endpoints

## 1. Enregistrement d'un utilisateur

**URL:** `/register`  
**Méthode:** `POST`  
**Description:** Enregistre un nouvel utilisateur dans la base de données.

### Requête:

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### Réponse de succès:

```json
{
  "message": "User registered successfully",
  "user": {
    "username": "string",
    "email": "string",
    "password": "hashed_password",
    "salt": "salt",
    "is_admin": false
  }
}
```

### Réponse en cas d'erreur:

```json
{
  "error": "Email already exists"
}
```

ou

```json
{
  "error": "Username already exists"
}
```

## 2. Mise à jour d'un utilisateur

**URL:** `/user/<string:username>`  
**Méthode:** `PUT`  
**Description:** Met à jour les informations d'un utilisateur existant.

### Requête:

```json
{
  "email": "string",
  "password": "string"
}
```

### Réponse de succès:

```json
{
  "message": "User updated successfully",
  "user": {
    "username": "string",
    "email": "string",
    "password": "hashed_password"
  }
}
```

### Réponse en cas d'erreur:

```json
{
  "error": "Field \"<field_name>\" not allowed for update"
}
```

## 3. Liste des utilisateurs

**URL:** `/users`  
**Méthode:** `GET`  
**Description:** Récupère la liste de tous les utilisateurs.

### Réponse de succès:

```json
{
  "users": [
    {
      "username": "string",
      "email": "string"
    },
    ...
  ]
}
```

## 4. Récupération d'un utilisateur par pseudo

**URL:** `/user/<string:username>`  
**Méthode:** `GET`  
**Description:** Récupère les informations d'un utilisateur par son nom d'utilisateur.

### Réponse de succès:

```json
{
  "user": {
    "username": "string",
    "email": "string"
  }
}
```

### Réponse en cas d'erreur:

```json
{
  "message": "User not found"
}
```

## 5. Suppression d'un utilisateur

**URL:** `/user/<string:username>`  
**Méthode:** `DELETE`  
**Description:** Supprime un utilisateur par son nom d'utilisateur.

### Réponse de succès:

```json
{
  "message": "User deleted successfully",
  "user": {
    "username": "string",
    "email": "string"
  }
}
```

### Réponse en cas d'erreur:

```json
{
  "message": "User not found"
}
```

## 6. Authentification d'un utilisateur

**URL:** `/login`  
**Méthode:** `POST`  
**Description:** Authentifie un utilisateur et renvoie un token JWT.

### Requête:

```json
{
  "username": "string",
  "password": "string"
}
```

### Réponse de succès:

```json
{
  "token": "jwt_token"
}
```

### Réponse en cas d'erreur:

```json
{
  "error": "Invalid credentials"
}
```
```

Vous pouvez copier et coller ce contenu dans un fichier `README.md` pour avoir une documentation complète de votre API.
```