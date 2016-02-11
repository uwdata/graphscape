# Manual to generate triplets

## Enumerating specs and edges
1. set options for enumerate specs in 'saving_specs_and_edges.js'.
- spec options
- location & filename

2. execute it by `node saving_specs_and_edges.js`

## Enumerating triplets
0. Enumerate specs and edges.
1. Set location of the specs and edges.
2. Run `node main.js`
  - If you encounted a memory shortage problem, then use `enumerate_batch.sh` with modifying the `start` and `end` parameters. They means the ids of start and end of specs.


## Deploy it to VLRuler (development environmet)

__TODO : should write after resolving the issue #12

## Deploy it to VLRuler (development environmet)

__TODO : should write after resolving the issue #121


Last update : 2016-02-09