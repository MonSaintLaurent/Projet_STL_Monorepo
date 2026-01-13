# Visu-STL-Front

## Lancer le projet

1. **Installer les dépendances :**
    ```bash
    npm install
    ```

2. **Configuration de l'environnement :**
    - Copiez le fichier `.env.template` en `.env`.
    - Renseignez vos propres credentials Auth0 dans le fichier `.env`.

3. **Configurer Auth0 :**
    - Créez une application sur [Auth0](https://auth0.com/).
    - Utilisez vos credentials dans le `.env`.
    - Dans le dashboard Auth0, autorisez les URLs suivantes :
      - **Allowed Callback URLs** : `http://localhost:3000`
      - **Allowed Logout URLs** : `http://localhost:3000`
      - **Allowed Web Origins** : `http://localhost:3000`

4. **Démarrer le projet :**
    ```bash
    npm run dev
    ```

Le projet sera accessible sur [http://localhost:5173](http://localhost:5173).




------------- TODO
- mettre des icones dans depollue
- gestion fin de jeu de findValue
- gérer les validations de point dans findValue : pour ceci, d'abord, check qu'on puisse communiquer avec PostgreSQL, récupérer les valeurs max
- créer les DB des personnes
- une fois profils faits, lier le gain de point aux jeux
- ajouter une page explications pour le depollue