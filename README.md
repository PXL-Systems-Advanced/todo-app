# Todo application

A small Node.js todo application for the PXL Docker course. The labs build it into an image and run it in containers.

Clone it with the GitHub CLI, or with Git:

```bash
gh repo clone PXL-Systems-Advanced/todo-app
git clone https://github.com/PXL-Systems-Advanced/todo-app.git
```

It stores its data in SQLite. When the variables `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD` and `MYSQL_DB` are set, it uses MySQL instead.

The application needs Node.js 24 or later, for its built-in SQLite module. You run it in the containers the labs describe, so you do not need Node.js on your laptop.

Course: <https://pxl-systems-advanced.github.io/docker-labs/>

The source code is licensed under the MIT License. See `LICENSE`.
