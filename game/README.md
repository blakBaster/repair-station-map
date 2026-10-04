# Game prototype v1

This folder is an isolated prototype game layer for the Repair Station Map repository.

## Safety boundary

- No existing Repair Station Map files are modified by this prototype.
- The prototype lives only under `/game`.
- It reads published station data from Supabase.
- It performs no station writes, moderation actions, admin calls, uploads or schema changes.
- Development is isolated on the `game-prototype-v1` branch.

## Current gameplay

- Warsaw map as the game world.
- Centered animated character.
- WASD / arrow movement.
- Shift to run.
- Stamina system.
- Camera follows player.
- Existing published Repair Stations are loaded as world objects.
- Nearby station detection.
- Press E to inspect a station.
- Basic touch controls are included for later mobile testing.

## Run

Serve the repository over HTTP and open:

`/game/`

A simple static server is enough. No build step is required.
