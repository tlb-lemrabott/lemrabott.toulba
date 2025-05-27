---
title: "How to Remove Sensitive Data from Your Git History Using BFG Repo-Cleaner"
description: "A step-by-step guide to safely remove accidentally committed secrets from your Git repository's entire history."
dateString: May 2024
draft: false
tags: ["Git", "Security", "BFG Repo-Cleaner", "Git History"]
weight: 200
---

## Problem Description

Accidentally committing sensitive data—such as passwords, API keys, tokens, or private URLs—to a Git repository can pose serious security risks. Unfortunately, simply deleting or changing these secrets in a new commit does **not** remove them from your Git history.
> Because Git preserves the full history, those sensitive values remain accessible in all previous commits, potentially exposing them to anyone with repository access.

## Goal

Completely remove all occurrences of sensitive data from **all past commits** in your Git repository, rewriting history to sanitize the repository while preserving all other code changes.

## Solution Overview

One of the most effective and user-friendly tools for this task is the [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/). It is designed specifically to quickly and safely clean unwanted data from Git repositories, much faster and simpler than Git's built-in `filter-branch` command.

---

## Step-by-Step Guide

### 1. Prepare a Replacements File

Create a plain text file (e.g., `replacements.txt`) listing the sensitive strings you want to remove, along with their replacement text.

**Important:** Use the syntax `sensitive_string==>replacement_text`

For example: `replacements.txt`
```bash {title="replacements.txt"}
mysecretpassword==>REMOVED
123456789abcdef==>REMOVED
https://private-api.example.com==>REMOVED
```

This tells BFG to find all occurrences of `mysecretpassword`, `123456789abcdef`, and the URL, replacing them with `REMOVED` throughout the entire Git history.

### 2. Clone Your Repository as a Bare Mirror

Run:

```bash
git clone --mirror git@github.com:youruser/your-repo.git
cd your-repo.git
```
This creates a bare clone of your repo that includes all refs and branches, which BFG will modify.

### 3. Download the BFG Repo-Cleaner
Download the latest BFG jar file from:

https://rtyley.github.io/bfg-repo-cleaner/

### 4. Run BFG with Your Replacements File
Run this command, replacing paths as needed:

```bash
java -jar /path/to/bfg.jar --replace-text /path/to/replacements.txt your-repo.git
```
BFG will scan your entire history and replace all sensitive data according to your replacements file.

### 5. Cleanup and Force Push Changes
After BFG finishes:
```bash
cd your-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```
This cleans up Git's internal data and forces the rewritten history back to your remote repository.

## 📍 Important Considerations
- Rewriting history affects all collaborators. Anyone who has cloned or forked the repo will need to reclone or reset their local copy to avoid conflicts.

- Backup your repository before starting. Test on a clone or disposable copy to avoid accidental data loss.

- This process removes the sensitive data from all commits and Git objects, but does not invalidate any external caches or copies (e.g., forks, CI caches).

- If you published secrets publicly, consider rotating or revoking them immediately.

## 💬 Conclusion
Accidentally committing secrets to Git happens more often than you'd think. The BFG Repo-Cleaner offers a fast, straightforward way to sanitize your repository's history and remove sensitive data from all previous commits.

By following these steps carefully, you can regain control of your repository's security and keep your development safe.

## 📖 References
- 🔗[BFG Repo-Cleaner Official Site](https://rtyley.github.io/bfg-repo-cleaner/) - Guide to
- 🔗[GitHub Docs: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) - Keeping your account and data secure - Removing sensitive data from a repository
- 🔗[Stack Overflow: Question: 4110652](https://stackoverflow.com/questions/4110652/how-to-substitute-text-from-files-in-git-history) - How to substitute text from files in git history