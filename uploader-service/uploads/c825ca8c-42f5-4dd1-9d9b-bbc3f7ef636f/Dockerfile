# Use an official Python base image
FROM python:3.11

# Set the working directory
WORKDIR /app

# Install Jupyter
RUN pip install --no-cache-dir jupyter

# Copy the notebook file into the container
COPY notebook.ipynb /app/

# Expose port 8000
EXPOSE 8000

# Command to execute the notebook directly
CMD ["jupyter", "execute", "notebook.ipynb"]
