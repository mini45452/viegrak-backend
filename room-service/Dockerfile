# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json) into the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Bundle the source code inside the Docker container
COPY . .

# Make port available to the world outside this container
EXPOSE 37104

# Define environment variable
ENV NODE_ENV production

# Run the app when the container launches
CMD ["node", "index.js"]
