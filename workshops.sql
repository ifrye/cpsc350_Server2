DROP DATABASE server2;
CREATE DATABASE server2;
\c server2

CREATE TABLE users (
	username text PRIMARY KEY NOT NULL UNIQUE,
	firstname text NOT NULL,
	lastname text NOT NULL,
	email text NOT NULL
);

CREATE TABLE workshops (
	id serial PRIMARY KEY,
       	title text NOT NULL,
	day date NOT NULL,
	location text NOT NULL,
	maxseats integer NOT NULL,
	instructor text NOT NULL
);

CREATE TABLE enrollment (
	username text PRIMARY KEY REFERENCES users (username),
	id integer REFERENCES workshops (id)
);

GRANT SELECT, INSERT ON users to new;
GRANT SELECT, INSERT ON workshops to new;
GRANT USAGE on workshops_id_seq to new;
GRANT SELECT, INSERT ON enrollment to new;
