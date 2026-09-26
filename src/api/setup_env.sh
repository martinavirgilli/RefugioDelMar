#!/bin/bash
# Script para configurar el archivo .env en Linux/Mac

echo "Configurando archivo .env para la API..."

# Verificar si .env ya existe
if [ -f ".env" ]; then
    read -p "El archivo .env ya existe. ¿Deseas sobrescribirlo? (s/n): " response
    if [ "$response" != "s" ] && [ "$response" != "S" ]; then
        echo "Operación cancelada."
        exit
    fi
fi

# Copiar .env.example a .env
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✓ Archivo .env creado desde .env.example"
else
    echo "✗ Error: No se encontró .env.example"
    exit 1
fi

# Generar SECRET_KEY seguro
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")

# Reemplazar SECRET_KEY en .env (Linux/Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|SECRET_KEY=django-insecure-change-this-in-production-use-a-secure-random-key|SECRET_KEY=$SECRET_KEY|g" .env
    sed -i '' "s|JWT_SECRET_KEY=django-insecure-change-this-in-production-use-a-secure-random-key|JWT_SECRET_KEY=$JWT_SECRET|g" .env
else
    # Linux
    sed -i "s|SECRET_KEY=django-insecure-change-this-in-production-use-a-secure-random-key|SECRET_KEY=$SECRET_KEY|g" .env
    sed -i "s|JWT_SECRET_KEY=django-insecure-change-this-in-production-use-a-secure-random-key|JWT_SECRET_KEY=$JWT_SECRET|g" .env
fi

echo "✓ SECRET_KEY y JWT_SECRET_KEY generados automáticamente"
echo ""
echo "¡Configuración completada!"
echo "Puedes editar el archivo .env si necesitas cambiar otros valores."

