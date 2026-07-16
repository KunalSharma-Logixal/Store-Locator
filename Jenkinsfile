pipeline {
agent {
label 'thinkpad-agent'
}

```
environment {
    APP_DIR = '/home/pranjal/apps/store-locator'
}

stages {

    stage('Checkout') {
        steps {
            checkout scm
        }
    }

    stage('Prepare App Directory') {
        steps {
            sh """
                mkdir -p ${APP_DIR}
                rsync -av --delete ./ ${APP_DIR}/
            """
        }
    }

    stage('Verify Docker') {
        steps {
            sh '''
                docker --version
                docker compose version
            '''
        }
    }

    stage('Build & Deploy') {
        steps {
            sh """
                cd ${APP_DIR}

                docker compose down || true

                docker compose build --no-cache

                docker compose up -d
            """
        }
    }

    stage('Cleanup') {
        steps {
            sh '''
                docker image prune -f
            '''
        }
    }

    stage('Health Check') {
        steps {
            sh """
                sleep 15

                docker ps

                curl -f http://localhost:10001 || true
                curl -f http://localhost:10000/docs || true
            """
        }
    }
}

post {

    success {
        echo 'Store Locator deployed successfully'
    }

    failure {
        echo 'Deployment failed'

        sh '''
            docker ps -a
            docker compose logs --tail=100 || true
        '''
    }
}
```

}
