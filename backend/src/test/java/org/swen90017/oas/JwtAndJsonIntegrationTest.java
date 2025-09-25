package org.swen90017.oas;


import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class JwtAndJsonIntegrationTest {

    @Test
    public void testJacksonJson() throws Exception {
        Person person = new Person("John", "Doe");
        ObjectMapper objectMapper = new ObjectMapper();

        String json = objectMapper.writeValueAsString(person);
        System.out.println("Serialized JSON: " + json);

        Person parsedPerson = objectMapper.readValue(json, Person.class);
        assertEquals(person.getFirstName(), parsedPerson.getFirstName());
        assertEquals(person.getLastName(), parsedPerson.getLastName());
    }

    @Test
    public void testJwtGenerationAndParsing() {
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

        String jws = Jwts.builder()
                .setSubject("testUser")
                .claim("role", "USER")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600 * 1000)) // Expires in 1 hour
                .signWith(key)
                .compact();

        System.out.println("Generated JWT: " + jws);
        assertNotNull(jws);

        // parse JWT and verify its claims
        Map<String, Object> claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(jws)
                .getBody();

        assertEquals("testUser", claims.get("sub"));
        assertEquals("USER", claims.get("role"));
    }

    // POJO for JSON test
    public static class Person {
        private String firstName;
        private String lastName;

        public Person() {
        }

        public Person(String firstName, String lastName) {
            this.firstName = firstName;
            this.lastName = lastName;
        }

        // Getters and setters
        public String getFirstName() {
            return firstName;
        }
        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }
        public String getLastName() {
            return lastName;
        }
        public void setLastName(String lastName) {
            this.lastName = lastName;
        }
    }
}