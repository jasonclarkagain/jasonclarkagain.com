// Interactive Birds Animation
document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const canvas = document.getElementById('birds-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Bird class
    class Bird {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 2;
            this.speed = Math.random() * 2 + 1;
            this.velocity = {
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1
            };
            this.color = '#ffffff';
        }
        
        update(mousePosition) {
            // Move away from mouse
            if (mousePosition) {
                const dx = this.x - mousePosition.x;
                const dy = this.y - mousePosition.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    this.velocity.x += dx / distance * 0.5;
                    this.velocity.y += dy / distance * 0.5;
                }
            }
            
            // Apply velocity
            this.x += this.velocity.x * this.speed;
            this.y += this.velocity.y * this.speed;
            
            // Normalize velocity
            const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            if (speed > 2) {
                this.velocity.x = (this.velocity.x / speed) * 2;
                this.velocity.y = (this.velocity.y / speed) * 2;
            }
            
            // Add some randomness
            this.velocity.x += (Math.random() - 0.5) * 0.2;
            this.velocity.y += (Math.random() - 0.5) * 0.2;
            
            // Boundary check
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            
            // Draw bird shape
            const angle = Math.atan2(this.velocity.y, this.velocity.x);
            
            // Body
            ctx.ellipse(
                this.x, 
                this.y, 
                this.size * 2, 
                this.size, 
                angle, 
                0, 
                Math.PI * 2
            );
            
            // Wings (flapping effect based on time)
            const wingSpan = this.size * 3;
            const wingHeight = this.size * (0.5 + Math.sin(Date.now() * 0.01 * this.speed) * 0.5);
            
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x - Math.cos(angle + Math.PI/2) * wingSpan,
                this.y - Math.sin(angle + Math.PI/2) * wingHeight
            );
            
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x - Math.cos(angle - Math.PI/2) * wingSpan,
                this.y - Math.sin(angle - Math.PI/2) * wingHeight
            );
            
            ctx.fill();
        }
    }
    
    // Create birds
    const birds = [];
    const birdCount = Math.min(Math.floor(canvas.width * canvas.height / 10000), 100);
    
    for (let i = 0; i < birdCount; i++) {
        birds.push(new Bird());
    }
    
    // Mouse tracking
    let mousePosition = null;
    
    canvas.addEventListener('mousemove', function(e) {
        mousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    });
    
    canvas.addEventListener('mouseleave', function() {
        mousePosition = null;
    });
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        birds.forEach(bird => {
            bird.update(mousePosition);
            bird.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    // Start animation
    animate();
});
