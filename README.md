# Les plugins Yapmod d’ilyeshdz

Mon [catalogue personnel](https://ilyeshdz.github.io/yapmod-plugin/) est construit à partir de [Plugin Starter](https://github.com/yapmod/plugin-starter). Chaque plugin publié dispose d’un téléchargement JavaScript et d’un lien à coller dans **Plugins → Add Plugin → Plugin URL** dans Yapmod.

## Développer un plugin

Avec Node 24 et pnpm 12, installer les dépendances depuis la racine avec `pnpm install`.

1. Créer `plugins/<slug>/` avec un nom court en minuscules, chiffres et tirets. Conserver ce nom après publication pour que le lien d’import reste stable.
2. Ajouter un `package.json` avec les champs texte `name`, `author`, `description` et `version`.
3. Dans `index.tsx`, exporter par défaut une fonction qui retourne les hooks `onLoad` et `onUnload`.
4. Lancer `pnpm dev <slug>` pour le rechargement à chaud ou `pnpm build` pour compiler le catalogue entier.

Le workflow **Plugin catalog** publie la page et les fichiers importables après chaque compilation réussie de `main`.
