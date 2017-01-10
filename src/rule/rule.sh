set -e

# define color
RED='\033[0;31m'
NC='\033[0m' # No Color


node lp.js
matlab -nodesktop < lp.m
node gen_ruleSet.js
rm idMap.json encodingCeiling.json costs.json lp.m
