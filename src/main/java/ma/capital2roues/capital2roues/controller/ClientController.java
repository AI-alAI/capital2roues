package ma.capital2roues.capital2roues.controller;

import ma.capital2roues.capital2roues.dto.ClientDTO;
import ma.capital2roues.capital2roues.model.Client;
import ma.capital2roues.capital2roues.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    @Autowired
    private ClientService clientService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllClients(
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<Client> clientsPage = clientService.findAll(pageable);
        
        List<ClientDTO> clientsDTO = clientsPage.getContent()
                .stream()
                .map(clientService::toDTO)
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", clientsDTO);
        response.put("currentPage", clientsPage.getNumber());
        response.put("totalItems", clientsPage.getTotalElements());
        response.put("totalPages", clientsPage.getTotalPages());
        response.put("size", clientsPage.getSize());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientDTO> getClientById(@PathVariable Long id) {
        Client client = clientService.findById(id);
        return ResponseEntity.ok(clientService.toDTO(client));
    }

    @PostMapping
    public ResponseEntity<ClientDTO> createClient(@RequestBody ClientDTO clientDTO) {
        Client client = clientService.create(clientDTO);
        return new ResponseEntity<>(clientService.toDTO(client), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientDTO> updateClient(@PathVariable Long id, @RequestBody ClientDTO clientDTO) {
        Client client = clientService.update(id, clientDTO);
        return ResponseEntity.ok(clientService.toDTO(client));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}