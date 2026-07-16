pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'store-locator'
        DOCKER_IMAGE_TAG  = "${BUILD_NUMBER}"
        CONTAINER_NAME    = 'store-locator-app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh "docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} -t ${DOCKER_IMAGE_NAME}:latest ."
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo 'Deploying application using Docker Compose...'
                // Stop existing container if running, then boot latest build
                sh 'docker compose down --remove-orphans || true'
                sh 'docker compose up -d'
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Cleaning up unused Docker resources...'
                // Prune dangling images to save disk space on Jenkins node
                sh 'docker image prune -f || true'
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully for build #${BUILD_NUMBER}!"
        }
        failure {
            echo "Deployment failed for build #${BUILD_NUMBER}. Please check the Jenkins console output."
        }
    }
}
