# 1. Install Conda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
chmod +x Miniconda3-latest-Linux-x86_64.sh
./Miniconda3-latest-Linux-x86_64.sh

# 2. Install Node.js and npm
sudo apt update
sudo apt install nodejs npm

# 3. Install dependencies
npm install
cd backend && npm install && cd ../frontend && npm install
cd ../py_api && ~/miniconda3/bin/conda env create -f environment.yml && cd ..

# 4. Activate Python environment
~/miniconda3/bin/conda activate uxr_api

# 5. Run all services (dev mode)
npm run dev
