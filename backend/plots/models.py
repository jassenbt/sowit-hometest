from django.db import models

class Plot(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)    
    culture_type = models.CharField(max_length=100, default="Inconnu") 
    surface = models.FloatField(default=0.0)                  
    geometry = models.JSONField() 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name