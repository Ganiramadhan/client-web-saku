pipeline {
    agent any

    parameters {
        string(name: 'VITE_API_BASE_URL', defaultValue: '/api/v1', description: 'Public API base path baked into the Vite bundle.')
        string(name: 'VITE_GOOGLE_CLIENT_ID', defaultValue: '', description: 'Public Google OAuth client ID.')
        string(name: 'VITE_TURNSTILE_SITE_KEY', defaultValue: '', description: 'Public Cloudflare Turnstile site key.')
        string(name: 'VITE_GA_MEASUREMENT_ID', defaultValue: '', description: 'Public Google Analytics measurement ID.')
        string(name: 'VITE_CLARITY_PROJECT_ID', defaultValue: '', description: 'Public Microsoft Clarity project ID.')
        choice(name: 'VITE_ANALYTICS_ENABLED', choices: ['false', 'true'], description: 'Enable analytics scripts in the built frontend.')
        choice(name: 'VITE_API_LOGGER', choices: ['false', 'true'], description: 'Enable frontend API request logging.')
        string(name: 'VITE_SENTRY_DSN', defaultValue: '', description: 'Public Sentry browser DSN. Leave empty to disable Sentry.')
        string(name: 'VITE_SENTRY_ENVIRONMENT', defaultValue: 'production', description: 'Sentry environment label.')
        string(name: 'VITE_SENTRY_TRACES_SAMPLE_RATE', defaultValue: '0.1', description: 'Sentry browser traces sample rate.')
    }

    environment {
        REGISTRY_HOST_CREDENTIALS_ID = "docker-registry-host"
        REGISTRY_USERNAME_CREDENTIALS_ID = "docker-registry-username"
        REGISTRY_PASSWORD_CREDENTIALS_ID = "docker-registry-credentials"

        DEPLOY_HOST_CREDENTIALS_ID = "ganipedia-host-ssh-server"
        DEPLOY_SSH_PORT_CREDENTIALS_ID = "ganipedia-host-ssh-port"
        DEPLOY_SSH_USER_CREDENTIALS_ID = "ganipedia-host-ssh-user"
        DEPLOY_SSH_PASSWORD_CREDENTIALS_ID = "ganipedia-host-ssh-password"

        IMAGE_NAME = "saku-finance-admin"
        CONTAINER_NAME = "web-saku-finance"
        DOCKER_NETWORK = "saku-finance"
        NETWORK_ALIAS = "web-saku-finance"
        CONTAINER_PORT = "3301"
        HEALTH_PATH = "/healthz"

        DOCKER_BUILDKIT = "1"
    }

    options {
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '15', artifactNumToKeepStr: '5'))
        timeout(time: 30, unit: 'MINUTES')
        skipStagesAfterUnstable()
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {
        stage('Checkout') {
            when {
                branch 'main'
            }
            steps {
                checkout scm
            }
        }

        stage('Initialize') {
            when {
                branch 'main'
            }
            steps {
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        returnStdout: true,
                        script: 'git rev-parse --short HEAD 2>/dev/null || echo unknown'
                    ).trim()
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                    env.LOCAL_IMAGE = "${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                    env.LOCAL_LATEST = "${env.IMAGE_NAME}:latest"

                    echo """
Build Configuration
-------------------
Branch      : ${env.BRANCH_NAME}
Commit      : ${env.GIT_COMMIT_SHORT}
Image       : ${env.IMAGE_NAME}:${env.IMAGE_TAG}
Latest      : ${env.IMAGE_NAME}:latest
Registry    : configured by Jenkins credentials
Remote      : configured by Jenkins credentials
Container   : ${CONTAINER_NAME}
Network     : ${DOCKER_NETWORK}
Alias       : ${NETWORK_ALIAS}:${CONTAINER_PORT}
"""
                }
            }
        }

        stage('Validate Configuration') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: "${REGISTRY_HOST_CREDENTIALS_ID}", variable: 'REGISTRY'),
                    string(credentialsId: "${REGISTRY_USERNAME_CREDENTIALS_ID}", variable: 'DOCKER_USER'),
                    string(credentialsId: "${REGISTRY_PASSWORD_CREDENTIALS_ID}", variable: 'DOCKER_PASS'),
                    string(credentialsId: "${DEPLOY_HOST_CREDENTIALS_ID}", variable: 'DEPLOY_HOST'),
                    string(credentialsId: "${DEPLOY_SSH_PORT_CREDENTIALS_ID}", variable: 'DEPLOY_SSH_PORT'),
                    string(credentialsId: "${DEPLOY_SSH_USER_CREDENTIALS_ID}", variable: 'DEPLOY_SSH_USER'),
                    string(credentialsId: "${DEPLOY_SSH_PASSWORD_CREDENTIALS_ID}", variable: 'SSH_PASS')
                ]) {
                    sh '''
                        set -euo pipefail
                        set +x

                        for name in REGISTRY DOCKER_USER DOCKER_PASS DEPLOY_HOST DEPLOY_SSH_PORT DEPLOY_SSH_USER SSH_PASS; do
                            eval "value=\\${$name:-}"
                            if [ -z "$value" ]; then
                                echo "ERROR: required Jenkins credential value $name is empty." >&2
                                exit 1
                            fi
                        done

                        case "$REGISTRY" in
                            http://*|https://*)
                                echo "ERROR: docker-registry-host must not include http:// or https://." >&2
                                exit 1
                                ;;
                        esac

                        case "$DEPLOY_SSH_PORT" in
                            *[!0-9]*|'')
                                echo "ERROR: SSH port credential must be numeric." >&2
                                exit 1
                                ;;
                        esac

                        case "$VITE_API_BASE_URL" in
                            http://*|https://*|/*)
                                ;;
                            *)
                                echo "ERROR: VITE_API_BASE_URL must be an absolute URL or root-relative path." >&2
                                exit 1
                                ;;
                        esac
                    '''
                }
            }
        }

        stage('Build Image') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    set -euo pipefail

                    docker build \
                        --tag "$LOCAL_IMAGE" \
                        --tag "$LOCAL_LATEST" \
                        --label "org.opencontainers.image.revision=$GIT_COMMIT_SHORT" \
                        --label "org.opencontainers.image.source=$JOB_NAME" \
                        --build-arg "VITE_API_BASE_URL=$VITE_API_BASE_URL" \
                        --build-arg "VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID" \
                        --build-arg "VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY" \
                        --build-arg "VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID" \
                        --build-arg "VITE_CLARITY_PROJECT_ID=$VITE_CLARITY_PROJECT_ID" \
                        --build-arg "VITE_ANALYTICS_ENABLED=$VITE_ANALYTICS_ENABLED" \
                        --build-arg "VITE_API_LOGGER=$VITE_API_LOGGER" \
                        --build-arg "VITE_SENTRY_DSN=$VITE_SENTRY_DSN" \
                        --build-arg "VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT" \
                        --build-arg "VITE_SENTRY_TRACES_SAMPLE_RATE=$VITE_SENTRY_TRACES_SAMPLE_RATE" \
                        --progress=plain \
                        .
                '''
            }
        }

        stage('Push Image') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: "${REGISTRY_HOST_CREDENTIALS_ID}", variable: 'REGISTRY'),
                    string(credentialsId: "${REGISTRY_USERNAME_CREDENTIALS_ID}", variable: 'DOCKER_USER'),
                    string(credentialsId: "${REGISTRY_PASSWORD_CREDENTIALS_ID}", variable: 'DOCKER_PASS')
                ]) {
                    sh '''
                        set -euo pipefail
                        set +x

                        IMAGE_FULL="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
                        IMAGE_LATEST="$REGISTRY/$IMAGE_NAME:latest"

                        docker tag "$LOCAL_IMAGE" "$IMAGE_FULL"
                        docker tag "$LOCAL_LATEST" "$IMAGE_LATEST"
                        printf '%s\n' "$DOCKER_PASS" | docker login "$REGISTRY" -u "$DOCKER_USER" --password-stdin
                        docker push "$IMAGE_FULL"
                        docker push "$IMAGE_LATEST"
                        docker logout "$REGISTRY"
                    '''
                }
            }
        }

        stage('Deploy Production') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: "${REGISTRY_HOST_CREDENTIALS_ID}", variable: 'REGISTRY'),
                    string(credentialsId: "${REGISTRY_USERNAME_CREDENTIALS_ID}", variable: 'DOCKER_USER'),
                    string(credentialsId: "${REGISTRY_PASSWORD_CREDENTIALS_ID}", variable: 'DOCKER_PASS'),
                    string(credentialsId: "${DEPLOY_HOST_CREDENTIALS_ID}", variable: 'DEPLOY_HOST'),
                    string(credentialsId: "${DEPLOY_SSH_PORT_CREDENTIALS_ID}", variable: 'DEPLOY_SSH_PORT'),
                    string(credentialsId: "${DEPLOY_SSH_USER_CREDENTIALS_ID}", variable: 'DEPLOY_SSH_USER'),
                    string(credentialsId: "${DEPLOY_SSH_PASSWORD_CREDENTIALS_ID}", variable: 'SSH_PASS')
                ]) {
                    sh '''
                        set -euo pipefail
                        set +x

                        ASKPASS_FILE="$(mktemp)"
                        REMOTE_SECRET_DIR="/tmp/$CONTAINER_NAME.$BUILD_NUMBER"
                        IMAGE_FULL="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG"

                        cleanup_local() {
                            rm -f "$ASKPASS_FILE"
                        }
                        trap cleanup_local EXIT

                        cat > "$ASKPASS_FILE" << 'ENDASKPASS'
#!/bin/sh
printf '%s\n' "$SSH_PASS"
ENDASKPASS
                        chmod 700 "$ASKPASS_FILE"

                        export SSH_ASKPASS="$ASKPASS_FILE"
                        export SSH_ASKPASS_REQUIRE=force
                        export DISPLAY="${DISPLAY:-:0}"

                        ssh_remote() {
                            runner="ssh"
                            if command -v setsid >/dev/null 2>&1; then
                                runner="setsid ssh"
                            fi

                            $runner \
                                -o StrictHostKeyChecking=no \
                                -o ConnectTimeout=30 \
                                -o BatchMode=no \
                                -p "$DEPLOY_SSH_PORT" \
                                "$DEPLOY_SSH_USER@$DEPLOY_HOST" "$@"
                        }

                        ssh_remote "rm -rf '$REMOTE_SECRET_DIR'; mkdir -p '$REMOTE_SECRET_DIR'; chmod 700 '$REMOTE_SECRET_DIR'"
                        printf '%s\n' "$DOCKER_PASS" | ssh_remote "umask 077; cat > '$REMOTE_SECRET_DIR/docker.pass'"
                        printf '%s\n' "$SSH_PASS" | ssh_remote "umask 077; cat > '$REMOTE_SECRET_DIR/sudo.pass'"

                        ssh_remote "cat > /tmp/$CONTAINER_NAME-deploy.sh" << 'REMOTE_SCRIPT'
#!/bin/sh
set -eu

docker_cmd() {
    if docker info >/dev/null 2>&1; then
        docker "$@"
        return
    fi

    if command -v sudo >/dev/null 2>&1; then
        sudo -S -p '' sh -c 'exec docker "$@"' sh "$@" < "$SUDO_PASS_FILE"
        return
    fi

    echo "ERROR: current user cannot access Docker and sudo is not available." >&2
    echo "Fix server permission with: sudo usermod -aG docker ${USER:-deploy-user} && newgrp docker" >&2
    exit 1
}

cleanup() {
    rm -rf "$REMOTE_SECRET_DIR" "/tmp/$CONTAINER_NAME-deploy.sh"
}
trap cleanup EXIT

echo "Checking Docker access..."
docker_cmd version >/dev/null

if ! docker_cmd network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
    echo "Creating Docker network $DOCKER_NETWORK..."
    docker_cmd network create "$DOCKER_NETWORK" >/dev/null
fi

echo "Authenticating remote Docker host to registry..."
docker_cmd login "$REGISTRY" -u "$DOCKER_USER" --password-stdin < "$DOCKER_PASS_FILE"

echo "Pulling $IMAGE_FULL..."
docker_cmd pull "$IMAGE_FULL"

PREVIOUS_IMAGE="$(docker_cmd inspect --format='{{.Config.Image}}' "$CONTAINER_NAME" 2>/dev/null || true)"
if [ -n "$PREVIOUS_IMAGE" ]; then
    echo "Previous image: $PREVIOUS_IMAGE"
fi

echo "Replacing container $CONTAINER_NAME..."
docker_cmd stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker_cmd rm "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker_cmd run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    --network "$DOCKER_NETWORK" \
    --network-alias "$NETWORK_ALIAS" \
    --expose "$CONTAINER_PORT" \
    "$IMAGE_FULL"

echo "Waiting for application health..."
for i in $(seq 1 10); do
    if docker_cmd exec "$CONTAINER_NAME" wget -qO- "http://127.0.0.1:$CONTAINER_PORT$HEALTH_PATH" >/dev/null 2>&1; then
        echo "Health check passed"
        docker_cmd logout "$REGISTRY" >/dev/null 2>&1 || true
        docker_cmd image prune -f >/dev/null 2>&1 || true
        exit 0
    fi

    echo "Health check attempt $i failed; retrying..."
    sleep 3
done

echo "ERROR: new container failed health check"
docker_cmd logs --tail=120 "$CONTAINER_NAME" 2>&1 || true

if [ -n "$PREVIOUS_IMAGE" ]; then
    echo "Attempting rollback to $PREVIOUS_IMAGE..."
    docker_cmd stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker_cmd rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker_cmd run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        --network "$DOCKER_NETWORK" \
        --network-alias "$NETWORK_ALIAS" \
        --expose "$CONTAINER_PORT" \
        "$PREVIOUS_IMAGE" || true
fi

docker_cmd logout "$REGISTRY" >/dev/null 2>&1 || true
exit 1
REMOTE_SCRIPT

                        ssh_remote "
                            chmod 700 /tmp/$CONTAINER_NAME-deploy.sh
                            REGISTRY='$REGISTRY' \
                            DOCKER_USER='$DOCKER_USER' \
                            IMAGE_FULL='$IMAGE_FULL' \
                            CONTAINER_NAME='$CONTAINER_NAME' \
                            DOCKER_NETWORK='$DOCKER_NETWORK' \
                            NETWORK_ALIAS='$NETWORK_ALIAS' \
                            CONTAINER_PORT='$CONTAINER_PORT' \
                            HEALTH_PATH='$HEALTH_PATH' \
                            REMOTE_SECRET_DIR='$REMOTE_SECRET_DIR' \
                            DOCKER_PASS_FILE='$REMOTE_SECRET_DIR/docker.pass' \
                            SUDO_PASS_FILE='$REMOTE_SECRET_DIR/sudo.pass' \
                            /tmp/$CONTAINER_NAME-deploy.sh
                        "
                    '''
                }
            }
        }

        stage('Verify Production') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: "${DEPLOY_HOST_CREDENTIALS_ID}", variable: 'DEPLOY_HOST'),
                    string(credentialsId: "${DEPLOY_SSH_PORT_CREDENTIALS_ID}", variable: 'DEPLOY_SSH_PORT'),
                    string(credentialsId: "${DEPLOY_SSH_USER_CREDENTIALS_ID}", variable: 'DEPLOY_SSH_USER'),
                    string(credentialsId: "${DEPLOY_SSH_PASSWORD_CREDENTIALS_ID}", variable: 'SSH_PASS')
                ]) {
                    sh '''
                        set -euo pipefail
                        set +x

                        ASKPASS_FILE="$(mktemp)"
                        cleanup_local() {
                            rm -f "$ASKPASS_FILE"
                        }
                        trap cleanup_local EXIT

                        cat > "$ASKPASS_FILE" << 'ENDASKPASS'
#!/bin/sh
printf '%s\n' "$SSH_PASS"
ENDASKPASS
                        chmod 700 "$ASKPASS_FILE"

                        export SSH_ASKPASS="$ASKPASS_FILE"
                        export SSH_ASKPASS_REQUIRE=force
                        export DISPLAY="${DISPLAY:-:0}"

                        ssh_remote() {
                            runner="ssh"
                            if command -v setsid >/dev/null 2>&1; then
                                runner="setsid ssh"
                            fi

                            $runner \
                                -o StrictHostKeyChecking=no \
                                -o ConnectTimeout=30 \
                                -o BatchMode=no \
                                -p "$DEPLOY_SSH_PORT" \
                                "$DEPLOY_SSH_USER@$DEPLOY_HOST" "$@"
                        }

                        REMOTE_VERIFY_DIR="/tmp/$CONTAINER_NAME.verify.$BUILD_NUMBER"
                        ssh_remote "rm -rf '$REMOTE_VERIFY_DIR'; mkdir -p '$REMOTE_VERIFY_DIR'; chmod 700 '$REMOTE_VERIFY_DIR'"
                        printf '%s\n' "$SSH_PASS" | ssh_remote "umask 077; cat > '$REMOTE_VERIFY_DIR/sudo.pass'"

                        ssh_remote "cat > /tmp/$CONTAINER_NAME-verify.sh" << 'REMOTE_VERIFY'
#!/bin/sh
set -eu

docker_cmd() {
    if docker info >/dev/null 2>&1; then
        docker "$@"
        return
    fi

    if command -v sudo >/dev/null 2>&1; then
        sudo -S -p '' sh -c 'exec docker "$@"' sh "$@" < "$SUDO_PASS_FILE"
        return
    fi

    echo "ERROR: current user cannot access Docker and sudo is not available." >&2
    exit 1
}

cleanup() {
    rm -rf "$REMOTE_VERIFY_DIR" "/tmp/$CONTAINER_NAME-verify.sh"
}
trap cleanup EXIT

if ! docker_cmd ps --filter "name=^/$CONTAINER_NAME\\$" --format "{{.Names}}" | grep -q "^$CONTAINER_NAME\\$"; then
    echo "ERROR: $CONTAINER_NAME is not running"
    docker_cmd logs --tail=120 "$CONTAINER_NAME" 2>&1 || true
    exit 1
fi

if ! docker_cmd inspect "$CONTAINER_NAME" --format "{{json .NetworkSettings.Networks}}" | grep -q "\"$DOCKER_NETWORK\""; then
    echo "ERROR: $CONTAINER_NAME is not attached to Docker network $DOCKER_NETWORK"
    exit 1
fi

docker_cmd exec "$CONTAINER_NAME" wget -qO- "http://127.0.0.1:$CONTAINER_PORT$HEALTH_PATH" >/dev/null
docker_cmd ps --filter "name=^/$CONTAINER_NAME\\$"
REMOTE_VERIFY

                        ssh_remote "
                            chmod 700 /tmp/$CONTAINER_NAME-verify.sh
                            CONTAINER_NAME='$CONTAINER_NAME' \
                            DOCKER_NETWORK='$DOCKER_NETWORK' \
                            CONTAINER_PORT='$CONTAINER_PORT' \
                            HEALTH_PATH='$HEALTH_PATH' \
                            REMOTE_VERIFY_DIR='$REMOTE_VERIFY_DIR' \
                            SUDO_PASS_FILE='$REMOTE_VERIFY_DIR/sudo.pass' \
                            /tmp/$CONTAINER_NAME-verify.sh
                        "
                    '''
                }
            }
        }
    }

    post {
        always {
            sh '''
                docker image prune -f >/dev/null 2>&1 || true
            '''
        }
        success {
            echo "Deployment successful: ${IMAGE_NAME}:${IMAGE_TAG}"
            echo "Nginx upstream: http://${NETWORK_ALIAS}:${CONTAINER_PORT}"
        }
        failure {
            echo "Deployment failed. Check Jenkins logs for details."
            echo "If the remote error is Docker socket permission, add the deploy user to the docker group on the production server."
        }
    }
}
