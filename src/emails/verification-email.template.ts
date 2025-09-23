export interface VerificationEmailData {
  firstName: string;
  verificationToken: string;
  verificationUrl: string;
}

export function generateVerificationEmailTemplate(data: VerificationEmailData): string {
  const { firstName, verificationUrl } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account - Nicole Pastry Arts</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f6f1ee;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(129, 42, 115, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #812a73 0%, #9a3485 100%);
            padding: 40px 30px;
            text-align: center;
            color: #ffffff;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }
        
        .tagline {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .content {
            padding: 40px 30px;
            background-color: #ffffff;
        }
        
        .greeting {
            font-size: 24px;
            color: #812a73;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .message {
            font-size: 16px;
            color: #1a1a1a;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .verification-section {
            background-color: #f6f1ee;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            border-left: 4px solid #812a73;
        }
        
        .verification-title {
            font-size: 18px;
            color: #812a73;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #812a73 0%, #9a3485 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(129, 42, 115, 0.3);
        }
        
        .verify-button:hover {
            background: linear-gradient(135deg, #6d2361 0%, #812a73 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(129, 42, 115, 0.4);
        }
        
        .alternative-link {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        
        .alternative-text {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
        }
        
        .link-text {
            font-size: 12px;
            color: #812a73;
            word-break: break-all;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        
        .security-note {
            background-color: #f6f1ee;
            border-radius: 6px;
            padding: 20px;
            margin: 30px 0;
            border-left: 3px solid #ff9800;
        }
        
        .security-title {
            font-size: 16px;
            color: #812a73;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .security-text {
            font-size: 14px;
            color: #666666;
            line-height: 1.6;
        }
        
        .footer {
            background-color: #f6f1ee;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        
        .footer-brand {
            font-size: 20px;
            color: #812a73;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .footer-text {
            font-size: 14px;
            color: #666666;
            margin-bottom: 15px;
        }
        
        .website-link {
            color: #812a73;
            text-decoration: none;
            font-weight: 600;
        }
        
        .website-link:hover {
            text-decoration: underline;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
            margin: 20px 0;
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 25px 20px;
            }
            
            .verification-section {
                padding: 20px;
            }
            
            .verify-button {
                padding: 14px 28px;
                font-size: 15px;
            }
            
            .greeting {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">Nicole Pastry Arts</div>
            <div class="tagline">Artisanal Pastries & Sweet Creations</div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">¡Hola ${firstName}!</div>
            
            <div class="message">
                ¡Bienvenido/a a Nicole Pastry Arts! Estamos emocionados de tenerte como parte de nuestra comunidad de amantes de la repostería artesanal.
            </div>
            
            <div class="message">
                Para completar tu registro y comenzar a disfrutar de nuestros deliciosos productos, necesitamos verificar tu dirección de correo electrónico.
            </div>
            
            <!-- Verification Section -->
            <div class="verification-section">
                <div class="verification-title">Verifica tu cuenta</div>
                <p style="color: #666666; margin-bottom: 25px; font-size: 14px;">
                    Haz clic en el botón de abajo para verificar tu cuenta y activar todos los beneficios:
                </p>
                
                <a href="${verificationUrl}" class="verify-button">
                    Verificar mi cuenta
                </a>
                
                <div class="alternative-link">
                    <div class="alternative-text">¿No puedes hacer clic en el botón? Copia y pega este enlace en tu navegador:</div>
                    <div class="link-text">${verificationUrl}</div>
                </div>
            </div>
            
            <!-- Security Note -->
            <div class="security-note">
                <div class="security-title">🔒 Nota de seguridad</div>
                <div class="security-text">
                    Este enlace de verificación expirará en 24 horas por tu seguridad. Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.
                </div>
            </div>
            
            <div class="message">
                Una vez verificada tu cuenta, podrás:
                <ul style="margin: 15px 0 0 20px; color: #666666;">
                    <li style="margin-bottom: 8px;">Realizar pedidos de nuestros productos artesanales</li>
                    <li style="margin-bottom: 8px;">Acceder a ofertas y promociones exclusivas</li>
                    <li style="margin-bottom: 8px;">Recibir notificaciones sobre nuevos productos</li>
                    <li style="margin-bottom: 8px;">Gestionar tu perfil y preferencias</li>
                </ul>
            </div>
            
            <div class="divider"></div>
            
            <div class="message" style="margin-bottom: 0;">
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-brand">Nicole Pastry Arts</div>
            <div class="footer-text">
                Repostería artesanal hecha con amor y los mejores ingredientes
            </div>
            <div class="footer-text">
                Visita nuestro sitio web: <a href="https://nicole.com.ec" class="website-link">nicole.com.ec</a>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #9e9e9e;">
                © ${new Date().getFullYear()} Nicole Pastry Arts. Todos los derechos reservados.
            </div>
        </div>
    </div>
</body>
</html>
  `;
}